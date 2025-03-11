import { CircleDashed, Search, X } from "@mynaui/icons-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

type SearchBarProps = {
	handleSearch: (query: string) => void;
	handleClear: () => void;
	showClear?: boolean;
	loading?: boolean;
	disabled?: boolean;
	searchOnType?: boolean;
}
export default function SearchBar({ handleSearch, handleClear, showClear = false, loading = false, disabled = false, searchOnType }: SearchBarProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [searched, setSearched] = useState(false);

	return (
		<div className="flex items-center">
			<div className="relative w-full">
				<Input
					className="pr-14 rounded-lg bg-card"
					value={searchQuery}
					onChange={e => {
						setSearchQuery(e.target.value)
						if (searchOnType) {
							handleSearch(e.target.value);
							setSearched(true);
						}
						if (!e.target.value) {
							setSearched(false);
						}
					}}
					onKeyDown={e => {
						if (e.key === 'Enter') {
							handleSearch(searchQuery);
							setSearched(true);
						}
					}}
					type="text"
					placeholder='Search'
					disabled={disabled || loading}
				/>
				<Button className={`h-full absolute right-0 top-0 disabled:bg-muted disabled:text-foreground`} onClick={() => handleSearch(searchQuery)} disabled={loading || disabled}>
					{loading ? <CircleDashed className="animate-spin" /> : <Search />}
				</Button>
			</div>
			<div className={`overflow-hidden transition-all ${(showClear || searched) ? "w-max pr-2 ml-2" : "w-0"}`}>
				<Button
					variant="secondary"
					onClick={() => {
						setSearchQuery("");
						setSearched(false);
						handleClear();
					}}
					disabled={disabled || loading}
				>
					<X />
				</Button>
			</div>
		</div>
	)
}
