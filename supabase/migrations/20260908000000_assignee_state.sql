-- Migration: Equipment State and Assignee enhancements

-- 1. Add condition_state to equipment
ALTER TABLE equipment 
ADD COLUMN condition_state text NOT NULL DEFAULT 'Good' 
CHECK (condition_state IN ('Good', 'For Replacement', 'Broken'));

-- 2. Add assignee_id to equipment
ALTER TABLE equipment 
ADD COLUMN assignee_id uuid REFERENCES personnel(id);

-- 3. Modify assignment_history to track assignment_type
ALTER TABLE assignment_history 
ADD COLUMN assignment_type text NOT NULL DEFAULT 'Custodian'
CHECK (assignment_type IN ('Custodian', 'Assignee'));

-- 4. Update the assignment check trigger to enforce rules for both roles
CREATE OR REPLACE FUNCTION check_equipment_assignment() RETURNS trigger AS $$
DECLARE
  p_status plantilla_status;
  p_division uuid;
  p_position text;
BEGIN
  -- Custodian rules
  IF NEW.assigned_to IS NOT NULL THEN
    SELECT plantilla_status, division_id, position INTO p_status, p_division, p_position FROM personnel WHERE id = NEW.assigned_to;
    IF p_status != 'Regular' OR p_position IN ('PSS', 'PES') THEN
      RAISE EXCEPTION 'Custodian must be Regular personnel and NOT a PSS/PES user.';
    END IF;
    IF p_division != NEW.division_id THEN
      RAISE EXCEPTION 'Custodian can only be assigned to equipment within the same division.';
    END IF;
  END IF;

  -- Assignee rules
  IF NEW.assignee_id IS NOT NULL THEN
    SELECT division_id, position INTO p_division, p_position FROM personnel WHERE id = NEW.assignee_id;
    IF p_position NOT IN ('PSS', 'PES') THEN
      RAISE EXCEPTION 'Assignee must be a PSS or PES user.';
    END IF;
    IF p_division != NEW.division_id THEN
      RAISE EXCEPTION 'Assignee can only be assigned to equipment within the same division.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
