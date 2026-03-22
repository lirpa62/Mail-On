const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

// 취업정보 게시판 URL
const boardUrl = "https://ce.pknu.ac.kr/ce/1813";

// 게시판 목록 크롤링 함수
async function fetchJobBoard() {
  try {
    const { data } = await axios.get(boardUrl);
    const $ = cheerio.load(data);
    const jobs = [];

    $("table.a_brdList tbody tr").each((index, element) => {
      // 공지사항인지 일반 게시물인지 확인
      const isNotice = $(element).hasClass("noti");

      // 게시물 번호 (공지사항일 경우 'NOTICE'로 표시됨)
      const number = $(element).find("td.bdlNum").text().trim();

      // 게시물 제목
      const title = $(element).find("td.bdlTitle a").text().trim();

      // 게시물 링크
      const link = $(element).find("td.bdlTitle a").attr("href");

      // 파일 첨부 여부
      const fileAttached =
        $(element).find("td.bdlFile img.lock_icon").length > 0;

      // 작성자
      const author = $(element).find("td.bdlUser").text().trim();

      // 작성일
      const date = $(element).find("td.bdlDate").text().trim();

      // 조회수
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

// 게시글 상세 정보 크롤링 함수
async function fetchJobDetail(url) {
  try {
    // URL이 상대 경로인 경우 전체 URL 구성
    const fullUrl = url.startsWith("http") ? url : `${boardUrl}${url}`;

    const { data } = await axios.get(fullUrl);
    const $ = cheerio.load(data);

    const decodeHtml = (html) => {
      return html
        .replace(/<!--[\s\S]*?-->/g, "") // HTML 주석 제거
        .replace(/\t+/g, "") // 연속된 탭 문자 제거
        .replace(/\s{2,}/g, " ")
        .trim() // 불필요한 공백 정리
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

    // 게시글 제목
    const title = $("td.bdvTitle").text().trim();

    // 작성일
    const date = $('tr:nth-child(2) th:contains("작성일")')
      .next("td")
      .text()
      .trim();

    // 첨부파일 정보
    const files = [];
    $("a.c_bdvFile").each((i, el) => {
      const fileName = $(el).text().trim();
      const fileUrl = $(el).attr("href");
      files.push({ fileName, fileUrl: `${boardUrl}${fileUrl}` });
    });

    // 게시글 내용
    const content = decodeHtml($("td.bdvEdit").html());

    // 이전글, 다음글 정보
    const nextPost = {
      title: $("span.bdvnNxt").parent().next().find("a").text().trim(),
      link: $("span.bdvnNxt").parent().next().find("a").attr("href"),
    };

    const prevPost = {
      title: $("span.bdvnPrv").parent().next().find("a").text().trim(),
      link: $("span.bdvnPrv").parent().next().find("a").attr("href"),
    };

    return {
      title,
      date,
      files,
      content,
      //   nextPost,
      //   prevPost,
    };
  } catch (error) {
    console.error("게시글 상세 정보 크롤링 중 오류 발생:", error);
    return null;
  }
}

// API 엔드포인트: 취업정보 게시판 목록
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await fetchJobBoard();
    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "취업정보 게시판 데이터를 가져오는 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// API 엔드포인트: 게시글 상세 정보
app.get("/api/jobs/detail", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL 파라미터가 필요합니다.",
      });
    }

    const detail = await fetchJobDetail(url);
    console.log(detail);
    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "게시글 상세 정보를 가져오는 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
