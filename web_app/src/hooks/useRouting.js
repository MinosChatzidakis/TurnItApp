import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import { useError } from "../Contexts/ErrorContext";

export function useRouting() {
  const navigate = useNavigate();
  const { clearError } = useError();

  const gotoPage = (page, param = "") => {
    const __page = page.toUpperCase().trim();

    if (ROUTES[__page]) {
      clearError();

      // If a parameter is passed in, append it to the route. Otherwise, use the base route.
      const targetUrl = param ? `${ROUTES[__page]}/${param}` : ROUTES[__page];

      navigate(targetUrl);
    } else {
      console.log(
        `Cannot navigate to ${page}. Url not found. Try '_' instead of '-'. `,
      );
    }
  };

  return {
    gotoPage,
  };
}
