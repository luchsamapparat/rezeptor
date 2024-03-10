import { Book, BookBookmark, Bookmarks, CaretLeft } from "@phosphor-icons/react";
import { Link, useLoaderData } from "@remix-run/react";
import { fetch } from "~/infrastructure/fetch";
import { Cookbook } from "~/model";

export async function clientLoader() {
    const response = await fetch(`/getCookbooks`);
    return response.json() as Promise<Cookbook[]>;
}

export default function Cookbooks() {
    const cookbooks = useLoaderData<typeof clientLoader>();

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <p><Link to="/cookbooks/new"><Book /> Kochbuch hinzufügen</Link></p>

            <ul>
                {cookbooks.map(cookbook => (
                    <li key={cookbook.id}>
                        <article>
                            <h2>{cookbook.title}</h2>
                            <p>{cookbook.authors.join(', ')}</p>
                            <footer>
                                <Link to={`/?cookbookId=${cookbook.id}`}><Bookmarks /> Rezepte anzeigen</Link>
                                <Link to={`/recipes/new?cookbookId=${cookbook.id}`}><BookBookmark /> Rezept merken</Link>
                            </footer>
                        </article>
                    </li>
                ))}
            </ul>
        </main>
    </>);
}
