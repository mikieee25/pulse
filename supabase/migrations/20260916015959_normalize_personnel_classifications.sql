UPDATE public.personnel
SET plantilla_status = CASE
  WHEN upper(trim(position)) ~ '^PES(\s|$)' THEN 'COS'::plantilla_status
  WHEN upper(trim(position)) ~ '^(PSS|DRIVER|DE|DATA ENCODER)(\s|$)' THEN 'Outsourced'::plantilla_status
  ELSE plantilla_status
END
WHERE upper(trim(position)) ~ '^(PES|PSS|DRIVER|DE|DATA ENCODER)(\s|$)';
