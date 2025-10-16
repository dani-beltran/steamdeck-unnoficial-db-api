export type SteamSearch = {
	items: SteamSearchItem[];
	total: number;
};

export type SteamSearchItem = {
	type: string;
	name: string;
	id: number;
	price: {
		currency: string;
		initial: number;
		final: number;
	};
	tiny_image: string;
	metascore: string;
	platforms: {
		windows: boolean;
		mac: boolean;
		linux: boolean;
	};
	streamingvideo: boolean;
	controller_support: string;
};

export type SteamAppDetailsResponse = Record<
	string,
	{ success: boolean; data: SteamApp }
>;

export type SteamApp = {
	type: string;
	name: string;
	steam_appid: number;
	required_age: string;
	is_free: boolean;
	controller_support?: string;
	dlc?: number[];
	detailed_description: string;
	about_the_game: string;
	short_description: string;
	supported_languages: string;
	reviews?: string;
	header_image: string;
	capsule_image: string;
	capsule_imagev5: string;
	website: string | null;
	pc_requirements: {
		minimum: string;
		recommended: string;
	};
	mac_requirements: {
		minimum: string;
		recommended: string;
	};
	linux_requirements: {
		minimum: string;
		recommended: string;
	};
	legal_notice?: string;
	developers: string[];
	publishers: string[];
	price_overview?: {
		currency: string;
		initial: number;
		final: number;
		discount_percent: number;
		initial_formatted: string;
		final_formatted: string;
	};
	packages: number[];
	package_groups: Array<{
		name: string;
		title: string;
		description: string;
		selection_text: string;
		save_text: string;
		display_type: number;
		is_recurring_subscription: string;
		subs: Array<{
			packageid: number;
			percent_savings_text: string;
			percent_savings: number;
			option_text: string;
			option_description: string;
			can_get_free_license: string;
			is_free_license: boolean;
			price_in_cents_with_discount: number;
		}>;
	}>;
	platforms: {
		windows: boolean;
		mac: boolean;
		linux: boolean;
	};
	metacritic?: {
		score: number;
		url: string;
	};
	categories: Array<{
		id: number;
		description: string;
	}>;
	genres: Array<{
		id: string;
		description: string;
	}>;
	screenshots: Array<{
		id: number;
		path_thumbnail: string;
		path_full: string;
	}>;
	movies?: Array<{
		id: number;
		name: string;
		thumbnail: string;
		webm: {
			480: string;
			max: string;
		};
		mp4: {
			480: string;
			max: string;
		};
		dash_av1?: string;
		dash_h264?: string;
		hls_h264?: string;
		highlight: boolean;
	}>;
	recommendations?: {
		total: number;
	};
	achievements?: {
		total: number;
		highlighted: Array<{
			name: string;
			path: string;
		}>;
	};
	release_date: {
		coming_soon: boolean;
		date: string;
	};
	support_info: {
		url: string;
		email: string;
	};
	background: string;
	background_raw: string;
	content_descriptors: {
		ids: number[];
		notes: string | null;
	};
	ratings?: {
		esrb?: {
			rating: string;
			descriptors: string;
			required_age: string;
			use_age_gate: string;
			interactive_elements?: string;
		};
		dejus?: {
			rating: string;
			descriptors: string;
			use_age_gate: string;
			required_age: string;
		};
		pegi?: {
			rating: string;
			descriptors: string;
			use_age_gate: string;
			required_age: string;
		};
		usk?: {
			rating: string;
			required_age: string;
			use_age_gate: string;
		};
		nzoflc?: {
			rating: string;
			descriptors: string;
			required_age: string;
			use_age_gate: string;
		};
		fpb?: {
			rating: string;
			required_age: string;
			use_age_gate: string;
		};
		csrr?: {
			rating: string;
			use_age_gate: string;
			required_age: string;
		};
		cero?: {
			rating: string;
			descriptors: string;
			required_age: string;
			use_age_gate: string;
		};
		crl?: {
			rating: string;
			use_age_gate: string;
			required_age: string;
		};
	};
};
