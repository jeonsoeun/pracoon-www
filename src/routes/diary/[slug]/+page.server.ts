import fs from 'fs';
import type { DiaryListItem } from '../$types.js';

export const load = async ({
	params
}: {
	params: {
		slug: string;
	};
}) => {
	const filePath = `src/data/diary-md/${params.slug}.md`;
	const content = fs.readFileSync(filePath, 'utf-8'); // 파일 읽기
	const slug = params.slug; // 파일명에서 확장자 제거
	const title = content.split('\n')[0].replace('# ', ''); // 첫 번째 줄에서 제목 추출

	// 수정된 파일일 경우 수정일자 추출(UNIX Milliseconds)
	const editedDate = slug.split('_')?.[1];
	// 파일명이 ISO양식 날짜이므로 날짜 추출
	const date = slug.split('_')?.[0];

	const parsedTitle = title ? title : 'Untitled'; // 제목이 50자를 넘어가면 ...으로 대체
	const parsedContent = content.split('\n').slice(1, 4).join('\n'); // 첫 번째 줄을 제외한 나머지 내용
	const post: DiaryListItem = {
		id: slug,
		title: parsedTitle,
		content: parsedContent,
		editDate: editedDate,
		date
	};

	return { post };
};
