# Hooks (useState / useEffect / useCallback / useMemo) — 問題マニフェスト

- **Topic ID**: b1b2c3d4-0001-4000-8000-000000000009
- **Total**: 5

## hooks_20260312_001.json (5 questions)

- [multiple/easy] useState closure: calling `setCount(count + 1)` three times — `function Counter() { const [count, setCount] = useState(0); ...`
- [code/medium] useEffect stale closure with setInterval — `function Timer() { const [count, setCount] = useState(0); useEffect(() => { const id = setInterval(...`
- [multiple/medium] useMemo with mutating `users.sort()` violating props immutability — `function UserList({ users }) { const sortedUsers = useMemo(...`
- [truefalse/easy] Calling useEffect inside an if statement is fine as long as dependency array is correct (false)
- [explain/medium] Explain the Rules of Hooks and why they are necessary
