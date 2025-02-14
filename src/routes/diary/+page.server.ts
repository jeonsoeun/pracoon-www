import fs from 'fs';
import path from 'path';
import type { DiaryList, DiaryListItem } from './$types.js';

export const load = async () => {
	const diaryPath = path.resolve('src/data/diary-md'); // 디렉터리 경로
	console.log(diaryPath);
	const indexFile = fs.readdirSync(diaryPath).find((file) => file.endsWith('index.json'));
	const files = fs.readdirSync(diaryPath).filter((file) => file.endsWith('.md')); // .md 파일 필터링

	const indexFileContent = indexFile
		? (JSON.parse(fs.readFileSync(path.join(diaryPath, indexFile), 'utf-8')) as DiaryList)
		: ({ posts: [] } as DiaryList);

	// 파일 작성

	const posts: DiaryListItem[] = files.reverse().map((file) => {
		const filePath = path.join(diaryPath, file);
		const content = fs.readFileSync(filePath, 'utf-8'); // 파일 읽기
		const slug = file.replace('.md', ''); // 파일명에서 확장자 제거
		const title = content.split('\n')[0].replace('# ', ''); // 첫 번째 줄에서 제목 추출

		// index.json 파일에 캐싱되어 있는 내용인지 확인
		const cached = indexFileContent.posts.find((post) => post.id === slug);
		if (cached) {
			return cached;
		}

		// 수정된 파일일 경우 수정일자 추출(UNIX Milliseconds)
		const editedDate = slug.split('_')?.[1];
		// 파일명이 ISO양식 날짜이므로 날짜 추출
		const date = slug.split('_')?.[0];

		const parsedTitle = title
			? title.length > 50
				? title.slice(0, 50) + '...'
				: title
			: 'Untitled'; // 제목이 50자를 넘어가면 ...으로 대체
		const parsedContent = content.split('\n').slice(1, 4).join('\n').slice(0, 200) + '...'; // 첫 번째 줄을 제외한 나머지 내용
		const newItem: DiaryListItem = {
			id: slug,
			title: parsedTitle,
			content: parsedContent,
			editDate: editedDate,
			date
		};

		return newItem;
	});
	return { posts };
};
