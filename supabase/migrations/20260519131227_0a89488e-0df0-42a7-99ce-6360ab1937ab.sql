
-- Helper: POST to the notify-task-assigned edge function
CREATE OR REPLACE FUNCTION public._post_task_assigned_email(_task_id uuid, _user_id uuid, _assigner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_key text;
  supabase_url text := 'https://tsbrvpgzawbbmuloxlkz.supabase.co';
BEGIN
  IF _user_id IS NULL OR _task_id IS NULL THEN RETURN; END IF;
  IF _user_id = _assigner_id THEN RETURN; END IF;

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-task-assigned',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'taskId', _task_id,
      'userId', _user_id,
      'assignerId', _assigner_id
    )
  );
END;
$$;

-- Trigger fn: manager_tasks insert/update of assigned_user_id or assigned_manager_id
CREATE OR REPLACE FUNCTION public.email_on_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mgr_user uuid;
BEGIN
  -- assigned_user_id changed/set
  IF NEW.assigned_user_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.assigned_user_id IS DISTINCT FROM OLD.assigned_user_id) THEN
    PERFORM public._post_task_assigned_email(NEW.id, NEW.assigned_user_id, NEW.user_id);
  END IF;

  -- assigned_manager_id changed/set
  IF NEW.assigned_manager_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.assigned_manager_id IS DISTINCT FROM OLD.assigned_manager_id) THEN
    mgr_user := public.user_id_for_manager(NEW.assigned_manager_id);
    IF mgr_user IS NOT NULL THEN
      PERFORM public._post_task_assigned_email(NEW.id, mgr_user, NEW.user_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_on_task_assignment ON public.manager_tasks;
CREATE TRIGGER trg_email_on_task_assignment
AFTER INSERT OR UPDATE OF assigned_user_id, assigned_manager_id ON public.manager_tasks
FOR EACH ROW EXECUTE FUNCTION public.email_on_task_assignment();

-- Trigger fn: manager_task_assignees insert
CREATE OR REPLACE FUNCTION public.email_on_task_assignee_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator uuid;
BEGIN
  SELECT user_id INTO creator FROM public.manager_tasks WHERE id = NEW.task_id;
  PERFORM public._post_task_assigned_email(NEW.task_id, NEW.user_id, creator);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_on_task_assignee_added ON public.manager_task_assignees;
CREATE TRIGGER trg_email_on_task_assignee_added
AFTER INSERT ON public.manager_task_assignees
FOR EACH ROW EXECUTE FUNCTION public.email_on_task_assignee_added();
