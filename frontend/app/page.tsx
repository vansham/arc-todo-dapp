'use client'

import { useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { CheckCircle2, Circle, Trash2, Plus, Wallet, LogOut, Loader2, ExternalLink, Zap, ListTodo } from 'lucide-react'

type Priority = 0 | 1 | 2
interface Task { id: bigint; title: string; description: string; completed: boolean; createdAt: bigint; priority: number }
interface Stats { 0: bigint; 1: bigint; 2: bigint }
const PRIORITY_LABELS = ['LOW', 'MEDIUM', 'HIGH']
function truncateAddress(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}` }

const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`
const ABI = [
  { inputs: [{ name: '_title', type: 'string' }, { name: '_description', type: 'string' }, { name: '_priority', type: 'uint8' }], name: 'createTask', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_taskId', type: 'uint256' }], name: 'completeTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_taskId', type: 'uint256' }], name: 'deleteTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'getMyTasks', outputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'completed', type: 'bool' }, { name: 'createdAt', type: 'uint256' }, { name: 'priority', type: 'uint8' }], name: '', type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getStats', outputs: [{ name: 'total', type: 'uint256' }, { name: 'completed', type: 'uint256' }, { name: 'pending', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>(1)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const { data: tasks, refetch } = useReadContract({ address: CONTRACT, abi: ABI, functionName: 'getMyTasks', account: address, query: { enabled: isConnected } })
  const { data: stats } = useReadContract({ address: CONTRACT, abi: ABI, functionName: 'getStats', account: address, query: { enabled: isConnected } })
  const isLoading = isPending || isTxLoading
  const statsData = stats as Stats | undefined

  const handleCreate = useCallback(() => {
    if (!title.trim()) return
    writeContract({ address: CONTRACT, abi: ABI, functionName: 'createTask', args: [title.trim(), description.trim(), priority] })
    setTitle(''); setDescription(''); setPriority(1); setShowForm(false)
    setTimeout(() => refetch(), 3000)
  }, [title, description, priority, writeContract, refetch])

  const handleComplete = useCallback((taskId: bigint) => {
    writeContract({ address: CONTRACT, abi: ABI, functionName: 'completeTask', args: [taskId] })
    setTimeout(() => refetch(), 3000)
  }, [writeContract, refetch])

  const handleDelete = useCallback((taskId: bigint) => {
    writeContract({ address: CONTRACT, abi: ABI, functionName: 'deleteTask', args: [taskId] })
    setTimeout(() => refetch(), 3000)
  }, [writeContract, refetch])

  const filteredTasks = (tasks as Task[] | undefined)?.filter(t => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  }) ?? []

  return (
    <main style={{ minHeight: '100vh', background: '#0A0612', color: '#E8E0FF', fontFamily: 'system-ui' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(123,63,228,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <header style={{ borderBottom: '1px solid rgba(123,63,228,0.2)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,6,18,0.9)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#7B3FE4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ListTodo size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18 }}>Arc<span style={{ color: '#9D6FF0' }}>Task</span></span>
          <span style={{ fontSize: 10, color: '#8B7AAF', background: 'rgba(123,63,228,0.1)', border: '1px solid rgba(123,63,228,0.2)', padding: '2px 8px', borderRadius: 4 }}>TESTNET</span>
        </div>
        {isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#9D6FF0', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />{truncateAddress(address!)}
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

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {!isConnected && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #7B3FE4, #5A2DB0)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 60px rgba(123,63,228,0.4)' }}>
              <ListTodo size={36} color="white" />
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>Your Tasks.<br /><span style={{ color: '#9D6FF0' }}>On-Chain.</span></h1>
            <p style={{ color: '#8B7AAF', fontSize: 18, marginBottom: 40 }}>Task manager on Arc blockchain. Powered by USDC gas.</p>
            <button onClick={() => connect({ connector: injected() })} style={{ background: '#7B3FE4', border: 'none', borderRadius: 12, padding: '14px 32px', cursor: 'pointer', color: 'white', fontSize: 16, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 0 30px rgba(123,63,228,0.4)' }}>
              <Wallet size={18} /> Connect Wallet to Start
            </button>
          </div>
        )}

        {isConnected && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total', value: statsData ? Number(statsData[0]) : 0, color: '#9D6FF0' },
                { label: 'Completed', value: statsData ? Number(statsData[1]) : 0, color: '#34D399' },
                { label: 'Pending', value: statsData ? Number(statsData[2]) : 0, color: '#FBBF24' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 16, padding: '20px 24px' }}>
                  <p style={{ fontSize: 12, color: s.color, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontSize: 36, fontWeight: 800 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(123,63,228,0.08)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 24 }}>
                <Loader2 size={16} color="#9D6FF0" />
                <span style={{ fontSize: 13, color: '#9D6FF0' }}>Transaction processing...</span>
                {txHash && <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: '#8B7AAF', textDecoration: 'none', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>View TX <ExternalLink size={10} /></a>}
              </div>
            )}

            {!showForm ? (
              <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer', fontSize: 14, background: 'rgba(123,63,228,0.05)', border: '1px dashed rgba(123,63,228,0.4)', color: '#9D6FF0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28, fontWeight: 600 }}>
                <Plus size={16} /> Add New Task
              </button>
            ) : (
              <div style={{ background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input type="text" placeholder="Task title..." value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 14, width: '100%', background: 'rgba(26,19,48,0.8)', border: '1px solid rgba(123,63,228,0.2)', color: '#E8E0FF', outline: 'none' }} />
                  <textarea placeholder="Description (optional)..." value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 14, width: '100%', background: 'rgba(26,19,48,0.8)', border: '1px solid rgba(123,63,228,0.2)', color: '#E8E0FF', outline: 'none', resize: 'none' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p, i) => (
                      <button key={p} onClick={() => setPriority(i as Priority)} style={{ flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: priority === i ? (i === 0 ? 'rgba(52,211,153,0.15)' : i === 1 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)') : 'rgba(26,19,48,0.5)', border: '1px solid', borderColor: priority === i ? (i === 0 ? 'rgba(52,211,153,0.4)' : i === 1 ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)') : 'rgba(123,63,228,0.2)', color: priority === i ? (i === 0 ? '#34D399' : i === 1 ? '#FBBF24' : '#F87171') : '#8B7AAF' }}>{p}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCreate} disabled={!title.trim() || isLoading} style={{ flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, background: '#7B3FE4', border: 'none', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!title.trim() || isLoading) ? 0.5 : 1 }}>
                      <Zap size={15} /> Create Task
                    </button>
                    <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(123,63,228,0.2)', color: '#8B7AAF' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 4, background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
              {(['all', 'pending', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', background: filter === f ? '#7B3FE4' : 'transparent', color: filter === f ? 'white' : '#8B7AAF' }}>{f}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8B7AAF' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>✦</p>
                  <p style={{ fontWeight: 600 }}>No tasks yet — add one above!</p>
                </div>
              )}
              {filteredTasks.map((task: Task) => (
                <div key={task.id.toString()} style={{ background: 'rgba(17,13,30,0.8)', border: '1px solid rgba(123,63,228,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: task.completed ? 0.6 : 1 }}>
                  <button onClick={() => !task.completed && handleComplete(task.id)} disabled={task.completed || isLoading} style={{ background: 'none', border: 'none', cursor: task.completed ? 'default' : 'pointer', color: task.completed ? '#34D399' : '#8B7AAF', padding: 0, marginTop: 2 }}>
                    {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#8B7AAF' : '#E8E0FF' }}>{task.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: task.priority === 0 ? 'rgba(52,211,153,0.1)' : task.priority === 1 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)', color: task.priority === 0 ? '#34D399' : task.priority === 1 ? '#FBBF24' : '#F87171', border: `1px solid ${task.priority === 0 ? 'rgba(52,211,153,0.3)' : task.priority === 1 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}` }}>{PRIORITY_LABELS[task.priority]}</span>
                    </div>
                    {task.description && <p style={{ fontSize: 13, color: '#8B7AAF', marginBottom: 6 }}>{task.description}</p>}
                    <p style={{ fontSize: 11, color: '#8B7AAF', fontFamily: 'monospace' }}>#{task.id.toString()}</p>
                  </div>
                  <button onClick={() => handleDelete(task.id)} disabled={isLoading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B7AAF', padding: 6, borderRadius: 8 }} onMouseEnter={e => (e.currentTarget.style.color = '#F87171')} onMouseLeave={e => (e.currentTarget.style.color = '#8B7AAF')}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
