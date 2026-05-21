import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import { useError } from "../Contexts/ErrorContext";

export function useRouting() {
  const navigate = useNavigate();
  const { clearError } = useError();

  const gotoPage = (page) => {
    const __page = page.toUpperCase();
    if (ROUTES[__page]) {
      clearError();
      navigate(ROUTES[__page]);
    } else {
      console.log(
        `Cannot navigate to ${page}. Url not found. Try '_' instead of '-'. `,
      );
    }
  };

  return {
    //routes: ROUTES, unecessary
    gotoPage,
  };
}
