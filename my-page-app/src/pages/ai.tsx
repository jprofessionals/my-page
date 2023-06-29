import Link from "next/link";

function AI() {
    return (

        <div className="p-4 prose" data-theme="jpro" style={{ minWidth: "375px" }}>
            <h2>AI tjenester</h2>

            Her finner du tjenester og verktøy basert på kunstig intelligens utviklet i JPro.
            <br/>


            <p>
                <Link href="/explorer" className="text-warning">
                {/*    <a className="text-warning">*/}
                        AI explorer.
                   {/* </a>*/}
                </Link>
                &nbsp;Her kan du reise verden rundt med kunstig intelligens.
            </p>
        </div>

    );
}

export default AI;