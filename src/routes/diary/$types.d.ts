export interface DiaryListItem {
	id: string;
	title: string;
	content: string;
	date: string;
	editDate?: string;
}

export interface DiaryList {
	posts: DiaryListItem[];
}
