import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Cliente = Database['public']['Tables']['clients']['Row'];

interface EditClientDialogProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditClientDialog({ cliente, open, onOpenChange, onSave }: EditClientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    sexo: "M",
    status: "ativo",
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome,
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        dataNascimento: cliente.data_nascimento || "",
        sexo: cliente.sexo || "M",
        status: cliente.status,
      });
    }
  }, [cliente]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!cliente) throw new Error("Cliente não selecionado");

      const { data, error } = await supabase
        .from('clients')
        .update({
          nome: form.nome,
          email: form.email || null,
          telefone: form.telefone || null,
          data_nascimento: form.dataNascimento || null,
          sexo: form.sexo,
          status: form.status,
        })
        .eq('id', cliente.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso",
      });
      onSave(); // Trigger callback if needed
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar aluno",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!cliente || !form.nome.trim()) return;
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="edit-nome">Nome</Label>
            <Input
              id="edit-nome"
              value={form.nome}
              onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo"
              disabled={updateMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              disabled={updateMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="edit-telefone">Telefone</Label>
            <Input
              id="edit-telefone"
              value={form.telefone}
              onChange={(e) => setForm(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-nascimento">Data de Nascimento</Label>
              <Input
                id="edit-nascimento"
                type="date"
                value={form.dataNascimento}
                onChange={(e) => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
                disabled={updateMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="edit-sexo">Sexo</Label>
              <Select disabled={updateMutation.isPending} value={form.sexo} onValueChange={(v) => setForm(prev => ({ ...prev, sexo: v }))}>
                <SelectTrigger id="edit-sexo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select disabled={updateMutation.isPending} value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.nome.trim() || updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
