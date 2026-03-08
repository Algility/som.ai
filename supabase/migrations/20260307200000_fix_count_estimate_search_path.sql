-- Fix: function search_path mutable (Security Advisor 0011)
-- Define count_estimate in public with explicit search_path so it is not mutable.
-- Run this in Supabase SQL Editor (or via supabase db push) to satisfy the advisor.
-- Note: The advisor may also flag pg_temp_*.count_estimate (session-scoped temp functions).
-- Those come from ad-hoc SQL runs and cannot be fixed by migration; ignore them and use public.count_estimate.

CREATE OR REPLACE FUNCTION public.count_estimate(query text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  plan jsonb;
BEGIN
  EXECUTE format('EXPLAIN (FORMAT JSON) %s', query) INTO plan;
  RETURN (plan->0->'Plan'->>'Plan Rows')::bigint;
END;
$$;

COMMENT ON FUNCTION public.count_estimate(text) IS 'Fast approximate row count from planner; uses search_path=public for security.';
