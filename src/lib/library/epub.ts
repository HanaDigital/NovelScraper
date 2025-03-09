import { ChapterT, NovelT } from "@/lib/sources/types";
import { readFile } from "@tauri-apps/plugin-fs";
import JSZip from "jszip";

export default class EpubTemplate {

	static generateEpub = async (novel: NovelT, chapters: ChapterT[]) => {
		// Root
		const zip = new JSZip();
		zip.file("mimetype", EpubTemplate._mimeType());

		// META-INF
		const metaInfFolder = zip.folder("META-INF");
		if (!metaInfFolder) throw new Error("Couldn't create META-INF folder");
		metaInfFolder.file("container.xml", EpubTemplate._container());

		// OEBPF
		const oebpfFolder = zip.folder("OEBPF");
		if (!oebpfFolder) throw new Error("Couldn't create OEBPF folder");
		oebpfFolder.file("cover.xhtml", EpubTemplate._coverXHTML(novel.title));
		oebpfFolder.file("ebook.opf", EpubTemplate._ebookOPF(novel.title, novel.authors, novel.description || "No description.", novel.genres, chapters));
		oebpfFolder.file("navigation.ncx", EpubTemplate._navigationNCX(novel.title, novel.authors, chapters));

		// OEBPF/css
		oebpfFolder.folder("css")?.file("ebook.css", EpubTemplate._ebookCSS());

		// OEBPF/content
		const oebpfContentFolder = oebpfFolder.folder("content");
		if (!oebpfContentFolder) throw new Error("Couldn't create OEBPF/content folder");
		oebpfContentFolder.file("toc.xhtml", EpubTemplate._tocXHTML(chapters));
		chapters.forEach((chapter, i) => {
			const id = i + 1;
			oebpfContentFolder.file(`s${id}.xhtml`, EpubTemplate._sIdXHTML(id, novel.title, novel.authors, novel.genres, chapter));
		});

		// OEBPF/images
		if (novel.localCoverPath) {
			const oebpfImagesFolder = oebpfFolder.folder("images");
			if (!oebpfImagesFolder) throw new Error("Couldn't create OEBPF/images folder");
			const coverImage = await readFile(novel.localCoverPath);
			oebpfImagesFolder.file("cover.jpeg", coverImage);
		}

		return await zip.generateAsync({ type: "uint8array" });
	}

	static _mimeType = () => "application/epub+zip";

	static _container = () => `<?xml version='1.0' encoding='UTF-8' ?>
<container version='1.0' xmlns='urn:oasis:names:tc:opendocument:xmlns:container'>
  <rootfiles>
    <rootfile full-path='OEBPF/ebook.opf' media-type='application/oebps-package+xml'/>
  </rootfiles>
</container>
`;

	static _navigationNCX = (
		title: string,
		authors: string[],
		chapters: ChapterT[],
	) => {
		const navPoints = chapters.map((chapter, i) => {
			const id = i + 1;
			const order = i + 3;
			return `	<navPoint class='section' id='s${id}' playOrder='${order}'>
		<navLabel><text>${chapter.title}</text></navLabel>
		<content src='content/s${id}.xhtml'/>
	</navPoint>
`;
		}).join("\n");

		return `<?xml version='1.0' encoding='UTF-8'?>
<!DOCTYPE ncx PUBLIC '-//NISO//DTD ncx 2005-1//EN' 'http://www.daisy.org/z3986/2005/ncx-2005-1.dtd'>
<ncx xmlns='http://www.daisy.org/z3986/2005/ncx/'>
<head>
	<meta name='dtb:uid' content='0000-0000-0001'/>
	<meta name='dtb:depth' content='1'/>
	<meta name='dtb:totalPageCount' content='0'/>
	<meta name='dtb:maxPageNumber' content='0'/>
</head>
<docTitle><text>${title}</text></docTitle>
<docAuthor><text>${authors.join(", ")}</text></docAuthor>
<navMap>
	<navPoint id='cover' playOrder='1'>
    <navLabel><text>Cover</text></navLabel>
    <content src='cover.xhtml'/>
	</navPoint>
	<navPoint class='toc' id='toc' playOrder='2'>
    <navLabel><text>Table of Contents</text></navLabel>
    <content src='content/toc.xhtml'/>
	</navPoint>
${navPoints}
</navMap>
</ncx>
`;
	}

	static _ebookOPF = (
		title: string,
		authors: string[],
		description: string,
		genres: string[],
		chapters: ChapterT[],
	) => {
		let items: any = [];
		let itemRefs: any = [];

		chapters.map((_, i) => {
			const id = i + 1;
			items.push(`	<item id='s${id}' media-type='application/xhtml+xml' href='content/s${id}.xhtml'/>`)
			itemRefs.push(`	<itemref idref='s${id}'/>`)
		});

		items = items.join("\n");
		itemRefs = itemRefs.join("\n");

		return `<?xml version='1.0' encoding='utf-8'?>
<package xmlns='http://www.idpf.org/2007/opf' version='2.0' unique-identifier='BookId'>
	<metadata xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:opf='http://www.idpf.org/2007/opf'>
	<dc:title>${title}</dc:title>
	<dc:identifier id='BookId' opf:scheme='URI'>0000-0000-0001</dc:identifier>
	<dc:language>en</dc:language>
	<dc:creator opf:role='aut' opf:file-as=''>${authors.join(", ")}</dc:creator>
	<dc:publisher></dc:publisher>
	<dc:description>${description}</dc:description>
	<dc:coverage></dc:coverage>
	<dc:source></dc:source>
	<dc:date opf:event='publication'></dc:date>
	<dc:date opf:event='modification'>2030-03-05</dc:date>
	<dc:rights></dc:rights>
	<dc:subject>${genres.join(", ")}</dc:subject>
	<meta name='cover' content='cover-image'/>
	</metadata>
	<manifest>
	<item id='cover-image' media-type='image/jpeg' href='images/cover.jpeg'/>
	<item id='cover' media-type='application/xhtml+xml' href='cover.xhtml'/>
	<item id='navigation' media-type='application/x-dtbncx+xml' href='navigation.ncx'/>
${items}
	<item id='toc' media-type='application/xhtml+xml' href='content/toc.xhtml'/>
	<item id='css' media-type='text/css' href='css/ebook.css'/>
	</manifest>
	<spine toc='navigation'>
	<itemref idref='cover' linear='yes' />
	<itemref idref='toc'/>
${itemRefs}
	</spine>
	<guide>
	<reference type='toc' title='Contents' href='content/toc.xhtml'></reference>
	</guide>
</package>
`;
	}

	static _coverXHTML = (title: string) => `<?xml version='1.0' encoding='UTF-8' ?>
<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN'  'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>
<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'>
<head>
  <title>${title}</title>
  <style type='text/css'>
    body { margin: 0; padding: 0; text-align: center; }
    .cover { margin: 0; padding: 0; font-size: 1px; }
    img { margin: 0; padding: 0; height: 100%; }
  </style>
</head>
<body>
  <div class='cover'><img style='height: 100%;width: 100%;' src='images/cover.jpeg' alt='Cover' /></div>
</body>
</html>
`;

	static _ebookCSS = () => "";

	static _tocXHTML = (chapters: ChapterT[]) => {
		const chapterLinks = chapters.map((chapter, i) => {
			const id = i + 1;
			return `  <a href='s${id}.xhtml'>${chapter.title}</a><br/>`;
		})

		return `<?xml version='1.0' encoding='utf-8'?>
<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>
<html xmlns='http://www.w3.org/1999/xhtml'>

<head>
  <title>Table of Contents</title>
  <link rel='stylesheet' type='text/css' href='../css/ebook.css' />
</head>

<body>
  <div class='contents'>
    <h1>Table of Contents</h1>
${chapterLinks}
  </div>
</body>

</html>
`;
	}

	static _sIdXHTML = (
		id: number,
		title: string,
		authors: string[],
		genres: string[],
		chapter: ChapterT,
	) => `<?xml version='1.0' encoding='utf-8'?>
<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>
<html xmlns='http://www.w3.org/1999/xhtml'>
  <head profile='http://dublincore.org/documents/dcmi-terms/'>
    <meta http-equiv='Content-Type' content='text/html;' />
    <title>${title} - ${chapter.title}</title>
    <meta name='DCTERMS.title' content='${title}' />
    <meta name='DCTERMS.language' content='en' scheme='DCTERMS.RFC4646' />
    <meta name='DCTERMS.source' content='NovelScraper' />
    <meta name='DCTERMS.issued' content='' scheme='DCTERMS.W3CDTF'/>
    <meta name='DCTERMS.creator' content='${authors.join(", ")}'/>
    <meta name='DCTERMS.contributor' content='' />
    <meta name='DCTERMS.modified' content='' scheme='DCTERMS.W3CDTF'/>
    <meta name='DCTERMS.provenance' content='' />
    <meta name='DCTERMS.subject' content='${genres.join(", ")}' />
    <link rel='schema.DC' href='http://purl.org/dc/elements/1.1/' hreflang='en' />
    <link rel='schema.DCTERMS' href='http://purl.org/dc/terms/' hreflang='en' />
    <link rel='schema.DCTYPE' href='http://purl.org/dc/dcmitype/' hreflang='en' />
    <link rel='schema.DCAM' href='http://purl.org/dc/dcam/' hreflang='en' />
    <link rel='stylesheet' type='text/css' href='../css/ebook.css' />
  </head>
  <body>
    <div id='s${id}'></div>
    <div>
		${chapter.content}
	</div>
  </body>
</html>
`;
}
