ALTER FUNCTION public.set_task_board_created_by() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.set_task_board_created_by() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_task_board_created_by() FROM anon;
GRANT EXECUTE ON FUNCTION public.set_task_board_created_by() TO authenticated;