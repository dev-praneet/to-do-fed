import { useQuery } from "@tanstack/react-query";

import { getToDo } from "../../queries/getToDo";
import { plus } from "../../public/svg/images";

import style from "./style.module.scss";

function Homepage() {
  const query = useQuery({ queryKey: [], queryFn: getToDo });
  const { data, isLoading } = query;

  function onPageClick() {}

  return (
    <div className={style.mainContainer}>
      <div></div>
      <div className={style.container}>
        <div className={style.sidebar}>
          {!isLoading &&
            data?.pages.map((page) => {
              return (
                <button
                  key={page.name}
                  className={style.pageName}
                  onClick={onPageClick}
                >
                  <span>{page.name}</span>
                </button>
              );
            })}

          <button className={style.addAPage}>
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
