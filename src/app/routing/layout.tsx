export default function RoutingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
        </div>
    );
}
