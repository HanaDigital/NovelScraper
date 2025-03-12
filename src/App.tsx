import "./App.css";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarProvider } from "./components/ui/sidebar";
import { getFirebaseAnalytics, initFirebase } from "./lib/firebase";

const app = initFirebase();
const analytics = getFirebaseAnalytics();

function App() {
	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar />
			<main className="bg-background w-full h-screen">
			</main>
		</SidebarProvider>
	);
}

export default App;
