import React, { useState } from "react";
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

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function AddClientDialog({ open, onOpenChange, onSave }: AddClientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    sexo: "M" as "M" | "F",
  });

  const insertMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from('clients')
        .insert({
          trainer_id: user.id,
          nome: form.nome,
          email: form.email || null,
          telefone: form.telefone || null,
          data_nascimento: form.dataNascimento || null,
          sexo: form.sexo,
          status: "ativo",
          total_avaliacoes: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Aluno adicionado com sucesso",
      });
      onSave(); // Trigger callback if needed
      onOpenChange(false);
      setForm({ nome: "", email: "", telefone: "", dataNascimento: "", sexo: "M" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar aluno",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!form.nome.trim()) return;
    insertMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="add-nome">Nome</Label>
            <Input
              id="add-nome"
              value={form.nome}
              onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo"
              disabled={insertMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              disabled={insertMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="add-telefone">Telefone</Label>
            <Input
              id="add-telefone"
              value={form.telefone}
              onChange={(e) => setForm(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
              disabled={insertMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-nascimento">Data de Nascimento</Label>
              <Input
                id="add-nascimento"
                type="date"
                value={form.dataNascimento}
                onChange={(e) => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
                disabled={insertMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="add-sexo">Sexo</Label>
              <Select disabled={insertMutation.isPending} value={form.sexo} onValueChange={(v) => setForm(prev => ({ ...prev, sexo: v as "M" | "F" }))}>
                <SelectTrigger id="add-sexo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={insertMutation.isPending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.nome.trim() || insertMutation.isPending}>
            {insertMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
