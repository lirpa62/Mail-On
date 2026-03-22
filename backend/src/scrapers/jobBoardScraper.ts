import axios from "axios";
import * as cheerio from "cheerio";

const baseUrl = "https://ce.pknu.ac.kr";
// 게시판 URL
const boardUrl = `${baseUrl}/ce/1813`;

// 게시판 목록 아이템 타입
interface JobItem {
  isNotice: boolean;
  number: string;
  title: string;
  link: string;
  fileAttached: boolean;
  author: string;
  date: string;
  views: string;
}

// 게시글 상세 정보 타입
interface JobDetail {
  title: string;
  date: string;
  files: {
    fileName: string;
    fileUrl: string;
  }[];
  content: string;
}

// 게시판 목록 크롤링
export async function fetchJobBoard(): Promise<JobItem[]> {
  try {
    const { data } = await axios.get(boardUrl);
    const $ = cheerio.load(data);
    const jobs: JobItem[] = [];

    $("table.a_brdList tbody tr").each((index, element) => {
      const isNotice = $(element).hasClass("noti");
      const number = $(element).find("td.bdlNum").text().trim();
      const title = $(element).find("td.bdlTitle a").text().trim();
      const link = $(element).find("td.bdlTitle a").attr("href") || "";
      const fileAttached =
        $(element).find("td.bdlFile img.lock_icon").length > 0;
      const author = $(element).find("td.bdlUser").text().trim();
      const date = $(element).find("td.bdlDate").text().trim();
      const views = $(element).find("td.bdlCount").text().trim();

      jobs.push({
        isNotice,
        number,
        title,
        link,
        fileAttached,
        author,
        date,
        views,
      });
    });

    return jobs;
  } catch (error) {
    console.error("취업정보 게시판 크롤링 중 오류 발생:", error);
    return [];
  }
}

// 게시글 상세 정보 크롤링
export async function fetchJobDetail(url: string): Promise<JobDetail | null> {
  try {
    const fullUrl = url.startsWith("https") ? url : `${boardUrl}${url}`;
    const { data } = await axios.get(fullUrl);
    const $ = cheerio.load(data);

    $("td.bdvEdit img").each((_, img) => {
      const $img = $(img);
      const existing = $img.attr("style") || "";
      $img.attr(
        "style",
        `${existing}${
          existing && existing.trim().endsWith(";") ? "" : ";"
        }display:block; width:95%; margin:0 auto;`
      );
    });

    $("td.bdvEdit p")
      .has("> img")
      .each((_, p) => {
        const $p = $(p);
        const existingPStyle = $p.attr("style") || "";
        $p.attr(
          "style",
          `${existingPStyle}${
            existingPStyle.trim().endsWith(";") ? "" : ";"
          }text-align:center;`
        );
      });

    const decodeHtml = (html: string): string => {
      return html
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\t+/g, "")
        .replace(/\s{2,}/g, " ")
        .trim()
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\\u003C/g, "<")
        .replace(/\\u003E/g, ">")
        .replace(/\\u0026/g, "&")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\n/g, "");
    };

    const title = $("td.bdvTitle").text().trim();
    const date = $('tr:nth-child(2) th:contains("작성일")')
      .next("td")
      .text()
      .trim();

    const files: JobDetail["files"] = [];
    $("a.c_bdvFile").each((_, el) => {
      const fileName = $(el).text().trim();
      const fileUrl = $(el).attr("href") || "";
      files.push({
        fileName,
        fileUrl: `${baseUrl}${fileUrl}`,
      });
    });

    const title_files_text = `<h3>${title}</h3>${
      files?.length
        ? files.length === 1
          ? `<a href="${files[0].fileUrl.replace(
              /"/g,
              "&quot;"
            )}" style="margin: 0px; padding: 0px; color: rgb(0, 143, 248); text-decoration-line: none; outline: none;padding-left: 25px;background: url(https://ce.pknu.ac.kr/images/front/sub/board_file.png) no-repeat left center;
    background-size: 18px auto;margin: 5px auto;">${files[0].fileName}</a>`
          : `<ul style="
    padding: 10px 20px;
    list-style: none;
">${files
              .map(
                (file) =>
                  `<li style="margin: 5px auto;
"><a href="${file.fileUrl.replace(
                    /"/g,
                    "&quot;"
                  )}" style="margin: 0px; padding: 0px; color: rgb(0, 143, 248); text-decoration-line: none; outline: none;padding-left: 25px;background: url(https://ce.pknu.ac.kr/images/front/sub/board_file.png) no-repeat left center;
    background-size: 18px auto;margin: 5px auto;">${file.fileName}</a></li>`
              )
              .join("")}</ul>`
        : ""
    }`;

    const content_html = decodeHtml($("td.bdvEdit").html() || "");
    const content = `
    <div style="margin-bottom: 20px;max-width: 90%;">
    <p style="font-size: 1.65rem;"><b>🍈 당신의 Mail을 ON 하세요!</b></p>
    </div>
    <div style="padding: 5px 10px;border-radius: 10px;border: #a3efca 3px solid;">${title_files_text.concat(
      content_html
    )}</div>
    `;

    return { title, date, files, content };
  } catch (error) {
    console.error("게시글 상세 정보 크롤링 중 오류 발생:", error);
    return null;
  }
}
