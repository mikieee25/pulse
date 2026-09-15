-- Normalize descriptive labels into the shared PULSE reporting categories.
-- Existing equipment and category costs are moved before duplicate labels are removed.
DO $$
DECLARE
  v_monitors uuid;
  v_headphones uuid;
BEGIN
  INSERT INTO equipment_categories (name, lifespan_years)
  VALUES ('Monitors', NULL), ('Headphones', NULL)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_monitors FROM equipment_categories WHERE name = 'Monitors';
  SELECT id INTO v_headphones FROM equipment_categories WHERE name = 'Headphones';

  INSERT INTO category_unit_costs (category_id, year, unit_cost)
  SELECT v_monitors, costs.year, costs.unit_cost
  FROM category_unit_costs costs
  JOIN equipment_categories source ON source.id = costs.category_id
  WHERE source.id <> v_monitors
    AND lower(source.name) LIKE '%monitor%'
    AND NOT EXISTS (
      SELECT 1 FROM category_unit_costs target
      WHERE target.category_id = v_monitors AND target.year = costs.year
    )
  ON CONFLICT (category_id, year) DO NOTHING;

  INSERT INTO category_unit_costs (category_id, year, unit_cost)
  SELECT v_headphones, costs.year, costs.unit_cost
  FROM category_unit_costs costs
  JOIN equipment_categories source ON source.id = costs.category_id
  WHERE source.id <> v_headphones
    AND (lower(source.name) LIKE '%headphone%' OR lower(source.name) LIKE '%earbud%')
    AND NOT EXISTS (
      SELECT 1 FROM category_unit_costs target
      WHERE target.category_id = v_headphones AND target.year = costs.year
    )
  ON CONFLICT (category_id, year) DO NOTHING;

  UPDATE equipment
  SET category_id = v_monitors
  WHERE category_id IN (
    SELECT id FROM equipment_categories
    WHERE id <> v_monitors AND lower(name) LIKE '%monitor%'
  );

  UPDATE equipment
  SET category_id = v_headphones
  WHERE category_id IN (
    SELECT id FROM equipment_categories
    WHERE id <> v_headphones
      AND (lower(name) LIKE '%headphone%' OR lower(name) LIKE '%earbud%')
  );

  DELETE FROM category_unit_costs
  WHERE category_id IN (
    SELECT id FROM equipment_categories
    WHERE id <> v_monitors AND lower(name) LIKE '%monitor%'
  )
  OR category_id IN (
    SELECT id FROM equipment_categories
    WHERE id <> v_headphones
      AND (lower(name) LIKE '%headphone%' OR lower(name) LIKE '%earbud%')
  );

  DELETE FROM equipment_categories
  WHERE (id <> v_monitors AND lower(name) LIKE '%monitor%')
     OR (id <> v_headphones AND (lower(name) LIKE '%headphone%' OR lower(name) LIKE '%earbud%'));
END $$;
