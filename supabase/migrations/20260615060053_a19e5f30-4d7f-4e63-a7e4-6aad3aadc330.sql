
CREATE TYPE public.task_status AS ENUM ('todo', 'ongoing', 'completed');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasks_user_status_position ON public.tasks(user_id, status, position);
