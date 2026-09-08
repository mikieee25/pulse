-- Migration to merge EEACPRAED into EPRED

DO $$
DECLARE
  v_eeacpraed uuid;
  v_epred uuid;
BEGIN
  SELECT id INTO v_eeacpraed FROM divisions WHERE code = 'EEACPRAED';
  SELECT id INTO v_epred FROM divisions WHERE code = 'EPRED';

  IF v_eeacpraed IS NOT NULL AND v_epred IS NOT NULL THEN
    -- Move all personnel to EPRED
    UPDATE personnel SET division_id = v_epred WHERE division_id = v_eeacpraed;
    
    -- Move all equipment (just in case)
    UPDATE equipment SET division_id = v_epred WHERE division_id = v_eeacpraed;
    
    -- Move app_users scopes (just in case)
    UPDATE app_users SET division_scope = v_epred WHERE division_scope = v_eeacpraed;
    
    -- Delete the duplicate division
    DELETE FROM divisions WHERE id = v_eeacpraed;
  END IF;
END $$;
