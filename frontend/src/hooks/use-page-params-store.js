import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
/**
 * Create a page params store to manage URL search params for different views.
 * @param {{
 *  viewNames: string[],
 *  defaultViewName: string
 * }} options
 * @returns {[string, (viewName: string) => void]} The current view name and a function to switch views.
 */
export default function usePageParamsStore({ viewNames, defaultViewName }) {
  const [pageState, setPageState] = useState(() => {
    const initialState = {};
    viewNames.forEach((key) => {
      initialState[key] = {};
    });
    return initialState;
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const currentViewName = searchParams.get("view") || defaultViewName;

  useEffect(() => {
    if (!searchParams.get("view") && defaultViewName) {
      switchPageParams(defaultViewName);
    }
  }, []);

  const switchPageParams = (viewName) => {
    if (pageState[viewName] === undefined) {
      throw new Error(`View name "${viewName}" is not registered in page params store.`);
    }

    if (currentViewName) {
      setPageState((prevState) => ({
        ...prevState,
        [currentViewName]: {
          ...prevState[currentViewName],
          ...Object.fromEntries(searchParams.entries()),
        },
      }));
    }

    const newState = pageState[viewName];
    setSearchParams({
      view: viewName,
      ...Object.fromEntries(
        Object.entries(newState).filter(([_, value]) => value !== undefined)
      )
    });
  };

  return [currentViewName, switchPageParams];
}
