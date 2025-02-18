import { useAccountLite } from "../accounts/useAccountLite";
import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { useEffect } from "react";
import { useRawAccountTransactions } from './useRawAccountTransactions';
import { useClient4, useNetwork } from '../network';
import { useWalletV4 } from '../accounts/useWalletV4';
import { useSetRecoilState } from "recoil";
import { PendingTransaction, pendingTransactionsState } from "../../state/pending";

export function usePendingWatcher() {
    const account = useSelectedAccount();
    const client = useClient4(useNetwork().isTestnet);
    const setPending = useSetRecoilState(pendingTransactionsState(account?.addressString || ''));

    const v4 = useWalletV4(client, account?.addressString || '');
    const lite = useAccountLite(account?.address || null);
    const firstTransaction = useRawAccountTransactions(client, account?.addressString || '').data?.pages[0]?.[0];

    useEffect(() => {
        const transactionsInSync = firstTransaction?.hash === lite?.last?.hash && (v4.data?.last || 0) >= (lite?.block || 0);

        // transactions are not in sync - skip
        if (!transactionsInSync) {
            return;
        }

        // do not clean pending while seqno is not ready
        if (!v4.data?.seqno) {
            return;
        }

        setPending((prev) => {
            if (prev.length === 0) {
                return prev;
            }
            return prev.map((a) => {
                if (a.seqno < v4.data!.seqno) {
                    return { ...a, status: 'sent' };
                }
                return a;
            });
        });
    }, [firstTransaction, lite, v4, setPending]);
}