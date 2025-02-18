import { Address } from '@ton/core';
import { useRawAccountTransactions } from './useRawAccountTransactions';
import { ContractMetadata } from '../../metadata/Metadata';
import { useContractMetadatas } from '../metadata/useContractMetadatas';
import { useJettonContents } from '../jettons/useJettonContents';
import { StoredContractMetadata, StoredJettonMaster } from '../../metadata/StoredMetadata';
import { useMemo } from 'react';
import { JettonMasterState } from '../../metadata/fetchJettonMasterContent';
import { TonClient4 } from '@ton/ton';
import { TransactionDescription } from '../../types';

export function getJettonMasterAddressFromMetadata(metadata: StoredContractMetadata | null) {
    if (metadata?.jettonMaster) {
        return metadata.address;
    } else if (metadata?.jettonWallet?.master) {
        return metadata.jettonWallet.master;
    }
    return null;
}

export function parseStoredMetadata(metadata: StoredContractMetadata): ContractMetadata {
    return {
        jettonMaster: metadata.jettonMaster ? {
            content: metadata.jettonMaster.content,
            mintalbe: metadata.jettonMaster.mintable,
            owner: metadata.jettonMaster.owner ? Address.parse(metadata.jettonMaster.owner) : null,
            totalSupply: BigInt(metadata.jettonMaster.totalSupply),
        } : undefined,
        jettonWallet: metadata.jettonWallet ? {
            balance: BigInt(metadata.jettonWallet.balance),
            master: Address.parse(metadata.jettonWallet.master),
            owner: Address.parse(metadata.jettonWallet.owner),
        } : undefined,
        seqno: metadata.seqno,
    };
}


export function useAccountTransactions(client: TonClient4, account: string, refetchOnMount: boolean = false): {
    data: TransactionDescription[] | null,
    next: () => void,
    hasNext: boolean,
    loading: boolean
} {
    let raw = useRawAccountTransactions(client, account, refetchOnMount);

    // We should memoize to prevent recalculation if metadatas and jettons are updated
    let { baseTxs, mentioned } = useMemo(() => {
        let baseTxs = raw.data?.pages.flat();
        let mentioned = baseTxs ? Array.from(new Set([...baseTxs?.flatMap(tx => tx.parsed.mentioned)])) : [];

        return {
            baseTxs,
            mentioned,
        };
    }, [raw.data]);

    const metadatas = useContractMetadatas(mentioned);
    const { metadatasMap, jettonMasters } = useMemo(() => {
        const metadatasMap = new Map<string, { metadata: ContractMetadata, jettonMasterAddress: string | null }>();
        const jettonMasters: string[] = [];
        for (let m of metadatas) {
            if (m.data) {
                let jettonAddress = getJettonMasterAddressFromMetadata(m.data);
                metadatasMap.set(m.data.address, {
                    jettonMasterAddress: jettonAddress,
                    metadata: parseStoredMetadata(m.data)
                });
                if (jettonAddress) {
                    jettonMasters.push(jettonAddress);
                }
            }
        }
        return {
            jettonMasters,
            metadatasMap,
        }
    }, [metadatas]);


    const jettonMasterMetadatas = useJettonContents(jettonMasters);
    let txs = useMemo(() => {
        return baseTxs?.map<TransactionDescription>((base) => {
            const metadata = metadatasMap.get(base.parsed.resolvedAddress);
            const jettonMasterAddress = metadata?.jettonMasterAddress;

            const jettonMasterMetadata = jettonMasterAddress ? jettonMasterMetadatas.find(a => a.data?.address === jettonMasterAddress)?.data ?? null : null;

            return ({
                id: `${base.lt}_${base.hash}`,
                base: base,
                icon: jettonMasterMetadata?.image?.preview256 ?? null,
                masterMetadata: jettonMasterMetadata,
                metadata: metadata ? metadata.metadata : null,
                verified: null,
                op: null,
                title: null,
            });
        }) || null;
    }, [baseTxs, metadatasMap, jettonMasterMetadatas]);

    return {
        data: txs,
        next: () => {
            if (!raw.isFetchingNextPage && !raw.isFetching && raw.hasNextPage) {
                raw.fetchNextPage();
            }
        },
        hasNext: !!raw.hasNextPage,
        loading: raw.isFetching,
    }
}