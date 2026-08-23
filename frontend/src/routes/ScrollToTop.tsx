import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Restores the top of the page on navigation, but leaves query-string changes
 * alone so paging through Browse doesn't yank the viewport around.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
