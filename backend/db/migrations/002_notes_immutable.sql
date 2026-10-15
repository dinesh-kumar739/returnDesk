CREATE FUNCTION forbid_note_changes() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'request_notes rows are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER request_notes_immutable
  BEFORE UPDATE OR DELETE ON request_notes
  FOR EACH ROW EXECUTE FUNCTION forbid_note_changes();