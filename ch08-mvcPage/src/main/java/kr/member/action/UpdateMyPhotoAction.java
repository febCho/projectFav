package kr.member.action;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.codehaus.jackson.map.ObjectMapper;

import com.oreilly.servlet.MultipartRequest;

import kr.controller.Action;
import kr.member.dao.MemberDAO;
import kr.util.FileUtil;

public class UpdateMyPhotoAction implements Action{

	@Override
	public String execute(HttpServletRequest request, HttpServletResponse response) throws Exception {
		Map<String,String> mapAjax = new HashMap<String,String>();
		
		HttpSession session = request.getSession();
		Integer user_num = (Integer)session.getAttribute("user_num");
		if(user_num==null) {//로그인이 되지 않은 경우
			mapAjax.put("result", "logout");
		}else {//로그인이 된 경우
			//파일 업로드 처리
			MultipartRequest multi = FileUtil.createFile(request);
			String photo = multi.getFilesystemName("photo");
			
			MemberDAO dao = MemberDAO.getinstance();
			//프로필 사진 수정
			dao.updateMyPhoto(photo, user_num);
			
			//이전 파일 삭제 처리
			String user_photo = (String)session.getAttribute("user_photo");
			FileUtil.removeFile(request, user_photo);
			
			//현재 파일로 세션 정보 갱신
			session.setAttribute("user_photo", photo);
			
			mapAjax.put("result", "success");
		}
		
		//결과 JSON 문자열 생성
		ObjectMapper mapper = new ObjectMapper();
		String ajaxData = mapper.writeValueAsString(mapAjax);
		
		request.setAttribute("ajaxData", ajaxData);
		
		return "/WEB-INF/views/common/ajax_view.jsp";
	}

}