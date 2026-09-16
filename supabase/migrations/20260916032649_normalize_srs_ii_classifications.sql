UPDATE public.personnel
SET plantilla_status = 'Regular'::plantilla_status
WHERE upper(trim(position)) ~ '^SRS II(\s|$)'
  AND plantilla_status = 'Outsourced'::plantilla_status;
