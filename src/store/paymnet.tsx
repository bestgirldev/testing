// stores/use-payments-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";

export type Payment = {
  id: string;
  amount: number;
  status: string;
  email: string;
};

type PaymentsStore = {
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  reorderPayments: (activeId: string, overId: string) => void;
  clearPayments: () => void;
  addPayment: (payment: Payment) => void;
};

export const usePaymentsStore = create<PaymentsStore>()(
  persist(
    (set) => ({
      payments: [],

      addPayment: (payment) =>
        set((state) => ({
          payments: [...state.payments, payment],
        })),

      setPayments: (payments) => set({ payments }),

      reorderPayments: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.payments.findIndex(
            (payment) => payment.id === activeId,
          );

          const newIndex = state.payments.findIndex(
            (payment) => payment.id === overId,
          );

          if (oldIndex === -1 || newIndex === -1) {
            return state;
          }

          return {
            payments: arrayMove(state.payments, oldIndex, newIndex),
          };
        }),

      clearPayments: () => set({ payments: [] }),
    }),
    {
      name: "payments-storage",
      storage: createJSONStorage(() => localStorage),

      // Optional, but recommended:
      // only persist the payments array, not functions/actions.
      partialize: (state) => ({
        payments: state.payments,
      }),
    },
  ),
);
