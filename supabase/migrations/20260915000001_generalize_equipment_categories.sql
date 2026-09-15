-- Keep category labels concise and apply the shared three-year lifecycle rule.
-- Existing equipment and category costs are moved before duplicate labels are removed.
DO $$
BEGIN
  UPDATE equipment_categories SET lifespan_years = 3;

  CREATE TEMP TABLE pulse_category_map (
    source_id uuid PRIMARY KEY,
    target_name text NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO pulse_category_map (source_id, target_name)
  SELECT id,
    CASE
      WHEN lower(name) LIKE '%monitor%' THEN 'Monitors'
      WHEN lower(name) LIKE '%headphone%' OR lower(name) LIKE '%earbud%' THEN 'Headphones'
      WHEN lower(name) LIKE '%printer%' OR lower(name) LIKE '%scanner%' THEN 'Printers & Scanners'
      WHEN lower(name) LIKE '%speaker%' THEN 'Speakers'
      WHEN lower(name) LIKE '%mic%' OR lower(name) LIKE '%microphone%' THEN 'Microphones'
      WHEN lower(name) LIKE '%hub%' OR lower(name) LIKE '%splitter%' THEN 'USB Hubs & Splitters'
      WHEN lower(name) LIKE '%keyboard%' OR lower(name) LIKE '%mouse%' THEN 'Keyboards & Mice'
      WHEN lower(name) LIKE '%tablet pen%' THEN 'Tablet Accessories'
      WHEN lower(name) LIKE '%ssd%' THEN 'Storage'
      WHEN lower(name) LIKE '%powerbank%' THEN 'Powerbanks'
      WHEN lower(name) LIKE '%hotspot%' THEN 'Wi-Fi Hotspots'
      WHEN lower(name) LIKE '%teleprompter%'
        OR lower(name) LIKE '%presentation%'
        OR lower(name) LIKE '%display adapter%' THEN 'Presentation Equipment'
      WHEN lower(name) LIKE '%voice recorder%' THEN 'Voice Recorders'
      WHEN lower(name) LIKE '%telephone%' THEN 'Telephones'
      WHEN lower(name) LIKE '%gimbal%' THEN 'GIMBAL'
      WHEN lower(name) LIKE '%radio%' THEN 'Radio Set'
      WHEN lower(name) LIKE '%laptop%' THEN 'Laptop'
      WHEN lower(name) LIKE '%desktop%' THEN 'Desktop'
      WHEN lower(name) = 'tablet' THEN 'Tablet'
      WHEN lower(name) LIKE '%drone%' THEN 'Drone'
      WHEN lower(name) LIKE '%camera%' THEN 'Camera'
      ELSE name
    END
  FROM equipment_categories;

  INSERT INTO equipment_categories (name, lifespan_years)
  SELECT DISTINCT target_name, 3
  FROM pulse_category_map
  ON CONFLICT (name) DO UPDATE SET lifespan_years = 3;

  INSERT INTO category_unit_costs (category_id, year, unit_cost)
  SELECT target.id, costs.year, costs.unit_cost
  FROM category_unit_costs costs
  JOIN pulse_category_map map ON map.source_id = costs.category_id
  JOIN equipment_categories target ON target.name = map.target_name
  WHERE costs.category_id <> target.id
    AND NOT EXISTS (
      SELECT 1
      FROM category_unit_costs existing
      WHERE existing.category_id = target.id AND existing.year = costs.year
    )
  ON CONFLICT (category_id, year) DO NOTHING;

  UPDATE equipment
  SET category_id = target.id
  FROM pulse_category_map map
  JOIN equipment_categories target ON target.name = map.target_name
  WHERE equipment.category_id = map.source_id
    AND equipment.category_id <> target.id;

  DELETE FROM category_unit_costs costs
  USING pulse_category_map map, equipment_categories target
  WHERE costs.category_id = map.source_id
    AND target.name = map.target_name
    AND costs.category_id <> target.id;

  DELETE FROM equipment_categories source
  USING pulse_category_map map, equipment_categories target
  WHERE source.id = map.source_id
    AND target.name = map.target_name
    AND source.id <> target.id;

  UPDATE equipment_categories SET lifespan_years = 3;
END $$;
