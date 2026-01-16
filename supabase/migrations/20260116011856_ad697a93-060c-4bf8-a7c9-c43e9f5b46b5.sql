-- Adicionar coluna para URL da foto de perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.profile_image_url IS 'URL da foto de perfil do usuário armazenada no storage';