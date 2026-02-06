"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

import http from "@/lib/http";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Types ---

type User = {
  id: string;
  name: string;
  email: string;
  kycStatus: "PENDING" | "APPROVED" | "REJECTED" | "NOT_STARTED";
  accountStatus: "ACTIVE" | "BLOCKED" | "SUSPENDED";
  balanceBRL: number;
  createdAt: string;
};

type UsersResponse = {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type AdjustmentResponse = {
  transaction: {
    id: string;
    type: string;
    subType: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    status: string;
  };
  newBalance: number;
};

// --- Schema ---

const adjustmentSchema = z.object({
  type: z.enum(["CREDIT", "DEBIT"], {
    required_error: "Selecione o tipo de ajuste",
  }),
  amount: z
    .number({
      required_error: "Informe o valor",
      invalid_type_error: "Informe um valor numérico",
    })
    .min(0.01, "Valor mínimo é R$ 0,01"),
  reason: z
    .string({ required_error: "Informe o motivo" })
    .min(5, "O motivo deve ter pelo menos 5 caracteres"),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

// --- Helpers ---

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "BLOCKED":
      return "bg-red-100 text-red-800";
    case "SUSPENDED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// --- Page ---

export default function BalanceAdjustmentPage() {
  // Customer search state
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  // Form state
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] =
    React.useState<AdjustmentFormValues | null>(null);
  const [result, setResult] = React.useState<AdjustmentResponse | null>(null);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: "CREDIT",
      amount: undefined,
      reason: "",
    },
  });

  // Search users
  const searchUsers = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "10");
      params.set("search", query);
      const response = await http.get<UsersResponse>(
        `/admin/users?${params.toString()}`
      );
      setUsers(response.data.data);
    } catch {
      toast.error("Falha ao buscar usuários");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  React.useEffect(() => {
    searchUsers(debouncedSearch);
  }, [debouncedSearch, searchUsers]);

  // Handle form submission — show confirmation
  function onSubmit(values: AdjustmentFormValues) {
    setPendingValues(values);
    setConfirmOpen(true);
  }

  // Confirmed submission
  async function handleConfirmedSubmit() {
    if (!pendingValues || !selectedUser) return;

    try {
      setSubmitting(true);
      setConfirmOpen(false);

      const response = await http.post<AdjustmentResponse>(
        `/accounts/${selectedUser.id}/balance-adjustment`,
        {
          type: pendingValues.type,
          amount: pendingValues.amount,
          reason: pendingValues.reason,
        }
      );

      setResult(response.data);
      toast.success("Ajuste de saldo realizado com sucesso!");
      form.reset({ type: "CREDIT", amount: undefined, reason: "" });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object" &&
        (err as Record<string, Record<string, Record<string, string>>>)
          .response?.data?.message
          ? (err as Record<string, Record<string, Record<string, string>>>)
              .response.data.message
          : "Falha ao realizar ajuste de saldo";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
      setPendingValues(null);
    }
  }

  // Reset entire flow
  function handleReset() {
    setSelectedUser(null);
    setSearch("");
    setUsers([]);
    setResult(null);
    form.reset({ type: "CREDIT", amount: undefined, reason: "" });
  }

  const watchedType = form.watch("type");
  const watchedAmount = form.watch("amount");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajuste de Saldo</h1>
        <p className="text-sm text-muted-foreground">
          Credite ou debite o saldo BRL de um cliente manualmente
        </p>
      </div>

      {/* Step 1: Customer Selection */}
      {!selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Selecionar Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, CPF/CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingUsers && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loadingUsers && search.trim() && users.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum usuário encontrado
              </p>
            )}

            {!loadingUsers && users.length > 0 && (
              <div className="space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearch("");
                      setUsers([]);
                    }}
                    className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {user.name || "Sem nome"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatBRL(user.balanceBRL)}
                        </p>
                        <Badge
                          className={cn("text-xs", getStatusColor(user.accountStatus))}
                        >
                          {user.accountStatus}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Customer Card */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cliente Selecionado</CardTitle>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Trocar cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">
                  {selectedUser.name || "Sem nome"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Saldo atual</p>
                <p className="text-xl font-bold">
                  {formatBRL(selectedUser.balanceBRL)}
                </p>
                <Badge
                  className={cn("text-xs", getStatusColor(selectedUser.accountStatus))}
                >
                  {selectedUser.accountStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Adjustment Form */}
      {selectedUser && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Dados do Ajuste</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Type Toggle */}
              <div className="space-y-2">
                <Label>Tipo de ajuste *</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("CREDIT")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all",
                          field.value === "CREDIT"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-muted hover:border-green-300"
                        )}
                      >
                        <ArrowUpCircle className="h-5 w-5" />
                        <span className="font-medium">Crédito</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("DEBIT")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all",
                          field.value === "DEBIT"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-muted hover:border-red-300"
                        )}
                      >
                        <ArrowDownCircle className="h-5 w-5" />
                        <span className="font-medium">Débito</span>
                      </button>
                    </div>
                  )}
                />
                {form.formState.errors.type && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.type.message}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (BRL) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    className="pl-9"
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo *</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Correção manual - depósito não processado"
                  rows={3}
                  {...form.register("reason")}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 5 caracteres. Este motivo será registrado para
                  auditoria.
                </p>
                {form.formState.errors.reason && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.reason.message}
                  </p>
                )}
              </div>

              {/* Preview */}
              {watchedAmount > 0 && (
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    watchedType === "CREDIT"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  )}
                >
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Prévia do ajuste
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      watchedType === "CREDIT"
                        ? "text-green-700"
                        : "text-red-700"
                    )}
                  >
                    {watchedType === "CREDIT" ? "+" : "-"}{" "}
                    {formatBRL(watchedAmount || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Saldo estimado:{" "}
                    <span className="font-medium">
                      {formatBRL(
                        watchedType === "CREDIT"
                          ? selectedUser.balanceBRL + (watchedAmount || 0)
                          : selectedUser.balanceBRL - (watchedAmount || 0)
                      )}
                    </span>
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Revisar e Confirmar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Success Result */}
      {result && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Ajuste Realizado com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{result.transaction.subType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium">
                  {formatBRL(result.transaction.amount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Saldo anterior</p>
                <p className="font-medium">
                  {formatBRL(result.transaction.balanceBefore)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Novo saldo</p>
                <p className="font-bold text-lg">
                  {formatBRL(result.newBalance)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Motivo</p>
              <p className="font-medium">{result.transaction.description}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ID da transação</p>
              <p className="font-mono text-sm">{result.transaction.id}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleReset}>Novo Ajuste</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Ajuste de Saldo
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p>
                  Você está prestes a realizar um ajuste de saldo que afeta
                  dinheiro real. Verifique os dados abaixo:
                </p>

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium">
                      {selectedUser?.name || selectedUser?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge
                      className={cn(
                        pendingValues?.type === "CREDIT"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {pendingValues?.type === "CREDIT" ? "Crédito" : "Débito"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span
                      className={cn(
                        "font-bold",
                        pendingValues?.type === "CREDIT"
                          ? "text-green-700"
                          : "text-red-700"
                      )}
                    >
                      {pendingValues?.type === "CREDIT" ? "+" : "-"}{" "}
                      {formatBRL(pendingValues?.amount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo atual</span>
                    <span className="font-medium">
                      {formatBRL(selectedUser?.balanceBRL ?? 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-muted-foreground">
                      Saldo estimado após ajuste
                    </span>
                    <span className="font-bold">
                      {formatBRL(
                        pendingValues?.type === "CREDIT"
                          ? (selectedUser?.balanceBRL ?? 0) +
                              (pendingValues?.amount ?? 0)
                          : (selectedUser?.balanceBRL ?? 0) -
                              (pendingValues?.amount ?? 0)
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <span className="text-muted-foreground text-sm">
                      Motivo
                    </span>
                    <p className="font-medium text-sm mt-1">
                      {pendingValues?.reason}
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              disabled={submitting}
              className={cn(
                pendingValues?.type === "CREDIT"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar Ajuste
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
