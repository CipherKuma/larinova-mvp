-- Add INSERT policy for larinova_doctors to allow user signup
DROP POLICY IF EXISTS "Users can insert own doctor profile" ON larinova_doctors;
CREATE POLICY "Users can insert own doctor profile"
ON larinova_doctors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
