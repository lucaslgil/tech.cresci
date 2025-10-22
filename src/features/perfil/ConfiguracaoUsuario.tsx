import { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ConfiguracaoUsuario() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: user?.email || '',
    telefone: '',
    cargo: '',
  });

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nome: data.nome || '',
          email: data.email || user.email || '',
          telefone: data.telefone || '',
          cargo: data.cargo || '',
        });
        setFotoPerfil(data.foto_perfil);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('usuarios')
        .upsert({
          id: user?.id,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          cargo: formData.cargo,
          foto_perfil: fotoPerfil,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar dados' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('perfis')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('perfis')
        .getPublicUrl(filePath);

      setFotoPerfil(publicUrl);
      setMessage({ type: 'success', text: 'Foto carregada com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload da foto' });
    } finally {
      setUploading(false);
    }
  };

  const handleAlterarSenha = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Link de redefinição de senha enviado para seu email!' 
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao enviar email' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Configurações do Usuário</h1>
        <p className="text-slate-600">Gerencie suas informações pessoais e preferências</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto de Perfil */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Foto de Perfil</h2>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {fotoPerfil ? (
                  <img 
                    src={fotoPerfil} 
                    alt="Perfil" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-200">
                    <span className="text-4xl font-bold text-white">
                      {formData.nome?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors">
                {uploading ? 'Enviando...' : 'Escolher Foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFoto}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2 text-center">
                PNG, JPG ou GIF (max. 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Formulário de Dados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações Pessoais</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Seu cargo ou função"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          {/* Segurança */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Segurança</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Senha</p>
                  <p className="text-sm text-slate-600">••••••••</p>
                </div>
                <button
                  type="button"
                  onClick={handleAlterarSenha}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
