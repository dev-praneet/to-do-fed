import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addPage, getToDo } from "../../queries/getToDo";
import { plus } from "../../public/svg/images";

import style from "./style.module.scss";
import { useState } from "react";

function Homepage() {
  const [activePage, setActivePage] = useState(null);

  const query = useQuery({ queryKey: ["pages"], queryFn: getToDo });
  const { data, isLoading } = query;

  function onPageClick() {}

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addPage,
    onSuccess: (res) => {
      queryClient.setQueryData(["pages"], (old) => {
        return { ...old, pages: [...old.pages, res.page] };
      });
    },
  });

  function addPageHandler() {
    mutation.mutate();
  }

  return (
    <div className={style.mainContainer}>
      <div></div>
      <div className={style.container}>
        <div className={style.sidebar}>
          {!isLoading &&
            data?.pages.map((page) => {
              return (
                <button
                  key={page.id}
                  className={style.pageName}
                  onClick={onPageClick}
                >
                  <span>{page.name}</span>
                </button>
              );
            })}

          <button
            className={style.addAPage}
            onClick={addPageHandler}
            disabled={mutation.isLoading}
          >
            <span className={style.plusWrapper}>{plus}</span>
            <span>Add a page</span>
          </button>
        </div>
        <div className={style.taskContainer}></div>
      </div>
    </div>
  );
}

export default Homepage;
