'use client'

import { useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Wallet, LogOut, Loader2, ExternalLink, Plus, ShoppingBag, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'

const MARKETPLACE = '0xB3d92eAA661d4FB61996cA5b0f011963bB7E9FC2' as `0x${string}`
const USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`

const MARKETPLACE_ABI = [
  { inputs: [{ name: '_title', type: 'string' }, { name: '_description', type: 'string' }, { name: '_bounty', type: 'uint256' }], name: 'postTask', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_taskId', type: 'uint256' }], name: 'takeTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_taskId', type: 'uint256' }], name: 'completeTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_taskId', type: 'uint256' }], name: 'approveTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_taskId', type: 'uint256' }], name: 'cancelTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'getAllTasks', outputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'poster', type: 'address' }, { name: 'worker', type: 'address' }, { name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'bounty', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'createdAt', type: 'uint256' }], name: '', type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
] as const

const USDC_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

const STATUS_LABELS = ['OPEN', 'IN PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED']
const STATUS_COLORS = ['#34D399', '#FBBF24', '#9D6FF0', '#34D399', '#F87171']

interface Task { id: bigint; poster: string; worker: string; title: string; description: string; bounty: bigint; status: number; createdAt: bigint }

function truncate(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}` }

export default function Marketplace() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash })
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bounty, setBounty] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'all' | 'mine'>('all')

  const { data: tasks, refetch } = useReadContract({ address: MARKETPLACE, abi: MARKETPLACE_ABI, functionName: 'getAllTasks', query: { enabled: isConnected } })
  const { data: usdcBalance } = useReadContract({ address: USDC, abi: USDC_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, query: { enabled: !!address } })

  const isLoading = isPending || isTxLoading
  const allTasks = (tasks as Task[] | undefined) ?? []
  const filteredTasks = tab === 'mine' ? allTasks.filter(t => t.poster.toLowerCase() === address?.toLowerCase() || t.worker.toLowerCase() === address?.toLowerCase()) : allTasks

  const handlePost = useCallback(async () => {
    if (!title.trim() || !bounty) return
    const bountyAmount = BigInt(Math.floor(parseFloat(bounty) * 1_000_000))
    // First approve USDC
    writeContract({ address: USDC, abi: USDC_ABI, functionName: 'approve', args: [MARKETPLACE, bountyAmount] })
    setTimeout(() => {
      writeContract({ address: MARKETPLACE, abi: MARKETPLACE_ABI, functionName: 'postTask', args: [title.trim(), description.trim(), bountyAmount] })
      setTitle(''); setDescription(''); setBounty(''); setShowForm(false)
      setTimeout(() => refetch(), 3000)
    }, 5000)
  }, [title, description, bounty, writeContract, refetch])

  const handleTake = useCallback((taskId: bigint) => {
    writeContract({ address: MARKETPLACE, abi: MARKETPLACE_ABI, functionName: 'takeTask', args: [taskId] })
    setTimeout(() => refetch(), 3000)
  }, [writeContract, refetch])

  const handleComplete = useCallback((taskId: bigint) => {
    writeContract({ address: MARKETPLACE, abi: MARKETPLACE_ABI, functionName: 'completeTask', args: [taskId] })
    setTimeout(() => refetch(), 3000)
  }, [writeContract, refetch])

  const handleApprove = useCallback((taskId: bigint) => {
    writeContract({ address: MARKETPLACE, abi: MARKETPLACE_ABI, functionName: 'approveTask', args: [taskId] })
    setTimeout(() => refetch(), 3000)
  }, [writeContract, refetch])

  const handleCancel = useCallback((taskId: bigint) => {
    writeContract({ address: MARKETPLACE, abi: MARKETPLACE_ABI, functionName: 'cancelTask', args: [taskId] })
    setTimeout(() => refetch(), 3000)
  }, [writeContract, refetch])

  return (
    <main style={{ minHeight: '100vh', background: '#0A0612', color: '#E8E0FF', fontFamily: 'system-ui' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(123,63,228,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(123,63,228,0.2)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,6,18,0.9)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#7B3FE4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18 }}>Arc<span style={{ color: '#9D6FF0' }}>Market</span></span>
            <span style={{ fontSize: 10, color: '#8B7AAF', background: 'rgba(123,63,228,0.1)', border: '1px solid rgba(123,63,228,0.2)', padding: '2px 8px', borderRadius: 4 }}>TESTNET</span>
          </div>
          <a href="/" style={{ fontSize: 13, color: '#8B7AAF', textDecoration: 'none' }}>← Todo App</a>
        </div>
        {isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {usdcBalance !== undefined && (
              <span style={{ fontSize: 12, color: '#34D399', fontFamily: 'monospace', background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.2)' }}>
                💵 {(Number(usdcBalance) / 1_000_000).toFixed(2)} USDC
              </span>
            )}
            <span style={{ fontSize: 13, color: '#9D6FF0', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />{truncate(address!)}
            </span>
            <button onClick={() => disconnect()} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#F87171', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <LogOut size={13} /> Disconnect
            </button>
          </div>
        ) : (
          <button onClick={() => connect({ connector: injected() })} style={{ background: '#7B3FE4', border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <Wallet size={15} /> Connect Wallet
          </button>
        )}
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {!isConnected ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #7B3FE4, #5A2DB0)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 60px rgba(123,63,228,0.4)' }}>
              <ShoppingBag size={36} color="white" />
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>Task Marketplace<br /><span style={{ color: '#9D6FF0' }}>Powered by USDC.</span></h1>
            <p style={{ color: '#8B7AAF', fontSize: 18, marginBottom: 40 }}>Post tasks with USDC bounty. Complete tasks. Get paid instantly on Arc!</p>
            <button onClick={() => connect({ connector: injected() })} style={{ background: '#7B3FE4', border: 'none', borderRadius: 12, padding: '14px 32px', cursor: 'pointer', color: 'white', fontSize: 16, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 0 30px rgba(123,63,228,0.4)' }}>
              <Wallet size={18} /> Connect Wallet to Start
            </button>
          </div>
        ) : (
          <>
            {/* TX Status */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(123,63,228,0.08)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 24 }}>
                <Loader2 size={16} color="#9D6FF0" />
                <span style={{ fontSize: 13, color: '#9D6FF0' }}>Transaction processing on Arc...</span>
                {txHash && <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: '#8B7AAF', textDecoration: 'none', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>View TX <ExternalLink size={10} /></a>}
              </div>
            )}

            {/* Post Task Button */}
            {!showForm ? (
              <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer', fontSize: 14, background: 'rgba(123,63,228,0.05)', border: '1px dashed rgba(123,63,228,0.4)', color: '#9D6FF0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28, fontWeight: 600 }}>
                <Plus size={16} /> Post New Task with USDC Bounty
              </button>
            ) : (
              <div style={{ background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: '#9D6FF0' }}>💜 Post New Task</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input type="text" placeholder="Task title..." value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 14, width: '100%', background: 'rgba(26,19,48,0.8)', border: '1px solid rgba(123,63,228,0.2)', color: '#E8E0FF', outline: 'none' }} />
                  <textarea placeholder="Task description..." value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 14, width: '100%', background: 'rgba(26,19,48,0.8)', border: '1px solid rgba(123,63,228,0.2)', color: '#E8E0FF', outline: 'none', resize: 'none' }} />
                  <div style={{ position: 'relative' }}>
                    <input type="number" placeholder="USDC Bounty (e.g. 1.5)" value={bounty} onChange={e => setBounty(e.target.value)} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 14, width: '100%', background: 'rgba(26,19,48,0.8)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', outline: 'none' }} />
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#34D399', fontWeight: 700, fontSize: 12 }}>USDC</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handlePost} disabled={!title.trim() || !bounty || isLoading} style={{ flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, background: '#7B3FE4', border: 'none', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!title.trim() || !bounty || isLoading) ? 0.5 : 1 }}>
                      <Zap size={15} /> Post Task + Lock USDC
                    </button>
                    <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(123,63,228,0.2)', color: '#8B7AAF' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
              {(['all', 'mine'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', background: tab === t ? '#7B3FE4' : 'transparent', color: tab === t ? 'white' : '#8B7AAF' }}>{t === 'all' ? 'All Tasks' : 'My Tasks'}</button>
              ))}
            </div>

            {/* Tasks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8B7AAF' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🏪</p>
                  <p style={{ fontWeight: 600 }}>No tasks yet — post the first one!</p>
                </div>
              )}
              {filteredTasks.map((task: Task) => (
                <div key={task.id.toString()} style={{ background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 14, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{task.title}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${STATUS_COLORS[task.status]}20`, color: STATUS_COLORS[task.status], border: `1px solid ${STATUS_COLORS[task.status]}40` }}>{STATUS_LABELS[task.status]}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#8B7AAF', marginBottom: 8 }}>{task.description}</p>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#8B7AAF', fontFamily: 'monospace' }}>
                        <span>👤 {truncate(task.poster)}</span>
                        {task.worker !== '0x0000000000000000000000000000000000000000' && <span>🔨 {truncate(task.worker)}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: 20 }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: '#34D399' }}>{(Number(task.bounty) / 1_000_000).toFixed(2)}</p>
                      <p style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>USDC</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {task.status === 0 && task.poster.toLowerCase() !== address?.toLowerCase() && (
                      <button onClick={() => handleTake(task.id)} disabled={isLoading} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(123,63,228,0.15)', border: '1px solid rgba(123,63,228,0.4)', color: '#9D6FF0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} /> Take Task
                      </button>
                    )}
                    {task.status === 1 && task.worker.toLowerCase() === address?.toLowerCase() && (
                      <button onClick={() => handleComplete(task.id)} disabled={isLoading} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34D399', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={13} /> Mark Complete
                      </button>
                    )}
                    {task.status === 2 && task.poster.toLowerCase() === address?.toLowerCase() && (
                      <button onClick={() => handleApprove(task.id)} disabled={isLoading} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34D399', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={13} /> Approve + Pay USDC
                      </button>
                    )}
                    {task.status === 0 && task.poster.toLowerCase() === address?.toLowerCase() && (
                      <button onClick={() => handleCancel(task.id)} disabled={isLoading} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                    <a href={`https://testnet.arcscan.app/address/${MARKETPLACE}`} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px solid rgba(123,63,228,0.2)', color: '#8B7AAF', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginLeft: 'auto' }}>
                      <ExternalLink size={13} /> ArcScan
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
