CREATE TYPE request_status AS ENUM ('open','in_review','approved','rejected','completed');
CREATE TYPE request_reason AS ENUM ('damaged','wrong_item','size_issue','not_as_described','changed_mind');
CREATE TYPE request_resolution AS ENUM ('refund','replacement','store_credit');

CREATE SEQUENCE request_ref_seq START 1001;

CREATE TABLE return_requests (
  id              BIGSERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE
                  DEFAULT 'RD-' || lpad(nextval('request_ref_seq')::text, 6, '0'),
  customer_name   TEXT NOT NULL CHECK (length(trim(customer_name)) > 0),
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT,
  order_number    TEXT NOT NULL,
  item_sku        TEXT NOT NULL,
  item_name       TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  reason          request_reason NOT NULL,
  status          request_status NOT NULL DEFAULT 'open',
  resolution      request_resolution,
  refund_amount   NUMERIC(10,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT approved_needs_resolution
    CHECK (status NOT IN ('approved','completed') OR resolution IS NOT NULL),
  CONSTRAINT refund_amount_rule
    CHECK (
      resolution IS NULL AND refund_amount IS NULL
      OR resolution = 'refund' AND refund_amount > 0
      OR resolution IN ('replacement','store_credit') AND refund_amount IS NULL
    )
);

CREATE UNIQUE INDEX one_live_request_per_item
  ON return_requests (order_number, item_sku)
  WHERE status NOT IN ('rejected','completed') AND deleted_at IS NULL;

CREATE INDEX idx_rr_status ON return_requests (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rr_reason ON return_requests (reason) WHERE deleted_at IS NULL;
CREATE INDEX idx_rr_created ON return_requests (created_at DESC);

CREATE TABLE request_notes (
  id          BIGSERIAL PRIMARY KEY,
  request_id  BIGINT NOT NULL REFERENCES return_requests(id),
  author      TEXT NOT NULL,
  body        TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notes_request ON request_notes (request_id, created_at);