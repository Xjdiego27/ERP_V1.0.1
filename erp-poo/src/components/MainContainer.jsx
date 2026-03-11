import '../styles/MainContainer.css';
export default function MainContainer ({children}){
    return (
        <main className="container">
            {children}
        </main>
    );
}