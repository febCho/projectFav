package kr.member.action;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import kr.controller.Action;
import kr.member.dao.MemberDAO;

public class AdminDetailUserAction implements Action{

	@Override
	public String execute(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession session = request.getSession();
		Integer user_num = (Integer)session.getAttribute("user_num");
		if(user_num == null) {//로그인이 되지 않은 경우
			return "redirect:/member/loginForm.do";
		}
		
		//관리자 체크
		Integer user_auth = (Integer)session.getAttribute("user_auth");
		if(user_auth != 9) {//관리자가 로그인하지 않은 경우
			return "/WEB-INF/views/common/notice.jsp";
		}
		
		//관리자로 로그인한 경우
		//전송된 데이터 인코딩 처리
		request.setCharacterEncoding("utf-8");
		
		//전송된 데이터 반환
		int mem_num = Integer.parseInt(request.getParameter("mem_num"));
		int auth = Integer.parseInt(request.getParameter("auth"));
		
		MemberDAO dao = MemberDAO.getinstance();
		dao.updateMemberByAdmin(auth, mem_num);
		
		request.setAttribute("mem_num", mem_num);
		
		//JSP 경로 반환
		return "/WEB-INF/views/member/detailUser.jsp";
	}

}
