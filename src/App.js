import { useEffect, useState } from "react";
import "./App.css";
import StarRating from "./StarRating";
import { setSelectionRange } from "@testing-library/user-event/dist/utils";
const tempMovieData = [
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
  },
  {
    imdbID: "tt0133093",
    Title: "The Matrix",
    Year: "1999",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
  },
  {
    imdbID: "tt6751668",
    Title: "Parasite",
    Year: "2019",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
  },
];

const tempWatchedData = [
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    runtime: 148,
    imdbRating: 8.8,
    userRating: 10,
  },
  {
    imdbID: "tt0088763",
    Title: "Back to the Future",
    Year: "1985",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BZmU0M2Y1OGUtZjIxNi00ZjBkLTg1MjgtOWIyNThiZWIwYjRiXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
    runtime: 116,
    imdbRating: 8.5,
    userRating: 9,
  },
];

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}
function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies ? movies.length : "0"}</strong> results
    </p>
  );
}

function Search({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(function () {
    const storedvalue = localStorage.getItem("watched");
    if (storedvalue) {
      return JSON.parse(storedvalue);
    } else {
      return [];
    }
  });

  const [isLoading, setisloading] = useState(false);
  const [error, seterror] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setselectedId] = useState(null);
  //const tempquery = "interstellar";

  function handleBack() {
    setselectedId(null);
  }

  useEffect(
    function () {
      const Controller = new AbortController();
      async function fetchMovies() {
        try {
          setisloading(true);
          seterror("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=c85f2714&s=${query}`,
            { signal: Controller.signal }
          );
          if (!res.ok) {
            throw new Error("Something went wrong while fecthing the data");
          }
          const data = await res.json();
          //console.log(data);
          if (data.Response === "False") {
            throw new Error("Movie not found");
          }

          setMovies(data.Search);
          seterror("");
        } catch (error) {
          if (error.message != "AbortError") {
            seterror(error.message);
          }
        } finally {
          setisloading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        seterror("");
        return;
      }
      handleBack();
      fetchMovies();
      return function () {
        Controller.abort();
      };
    },
    [query]
  );
  function handleMovieDelete(id) {
    setWatched(watched.filter((movie) => movie.imdbId !== id));
  }
  return (
    <>
      <NavBar>
        {" "}
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />{" "}
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList
              movies={movies}
              selectedId={selectedId}
              setselectedId={setselectedId}
            />
          )}
          {error && <Errormessage message={error} />}
        </Box>
        <Box>
          <>
            {selectedId ? (
              <MovieDetails
                selectedId={selectedId}
                setselectedId={setselectedId}
                query={query}
                setWatched={setWatched}
                watched={watched}
                handleBack={handleBack}
              />
            ) : (
              <>
                <WatchedSummary watched={watched} />
                <WatchedMoviesList
                  watched={watched}
                  handleMovieDelete={handleMovieDelete}
                />
              </>
            )}
          </>
        </Box>
      </Main>
    </>
  );
}

function MovieDetails({
  selectedId,
  setselectedId,
  query,
  setWatched,
  watched,
  handleBack,
}) {
  const [Movie, setMovie] = useState({});
  const [isLoading, setisloading] = useState(false);
  const [userRating, setUserRating] = useState("");
  // if (Watched) {
  //   const isWatched = Watched.map((movie) => movie.imdbID).includes(selectedId);
  // } else {
  //   const isWatched = false;
  // }
  const isWatched = watched
    ? watched.map((movie) => movie.imdbId).includes(selectedId)
    : false;

  const watchedUserRating = watched.find(
    (movie) => movie.imdbId == selectedId
  )?.userRating;
  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          handleBack();
        }
      }
      document.addEventListener("keydown", callback);
      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [handleBack]
  );

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = Movie;

  useEffect(
    function () {
      async function getMovieDetails() {
        setisloading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=c85f2714&i=${selectedId}`
        );

        const data = await res.json();

        setMovie(data);
        setisloading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "usePopCorn";
      };
    },
    [title]
  );
  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  function handleAddMovie() {
    const newMovie = {
      imdbId: selectedId,
      poster,
      title,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    };

    setWatched((Watched) => [...Watched, newMovie]);
    document.title = `Movie | ${title}`;
    setselectedId(null);
  }

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={handleBack}>
              &larr;
            </button>
            <img src={poster} alt={`poster of the movie ${title}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released}&bull;{runtime}
              </p>
              <p>{genre}</p>
              <p>⭐ {imdbRating} imdbRating</p>
            </div>
          </header>
          <section>
            {!isWatched ? (
              <>
                <div className="rating">
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                </div>
                {userRating > 0 && (
                  <button className="btn-add" onClick={() => handleAddMovie()}>
                    + Add to list
                  </button>
                )}
              </>
            ) : (
              <p>
                This movie is already selected with rating {watchedUserRating}⭐{" "}
              </p>
            )}
            <p>
              <em>{plot}</em>
            </p>
            <p>starring actors{actors}</p>
            <p>Directed by -{director}</p>
          </section>
        </>
      )}
    </div>
  );
}
function Errormessage({ message }) {
  return <p className="error">⚠️{message}</p>;
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}
function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

/*function WatchedBox() {


  const [isOpen2, setIsOpen2] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen2((open) => !open)}
      >
        {isOpen2 ? "–" : "+"}
      </button>
      {isOpen2 && (
       
      )}
    </div>
  );
}*/
function MovieList({ movies, selectedId, setselectedId }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          selectedId={selectedId}
          setselectedId={setselectedId}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, selectedId, setselectedId }) {
  function handle(movie) {
    if (selectedId === movie.imdbID) {
      setselectedId(null);
      // document.title = `usePopCorn`;
    } else {
      setselectedId(movie.imdbID);
      //document.title = `Movie | ${movie.Title}`;
    }

    // console.log(movie);
    // console.log(`Movie | ${movie.Title}`);
  }
  return (
    <li key={movie.imdbID} onClick={() => handle(movie)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, handleMovieDelete }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbId}
          handleMovieDelete={handleMovieDelete}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, handleMovieDelete }) {
  return (
    <li key={movie.imdbId}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => handleMovieDelete(movie.imdbId)}
        >
          ❌
        </button>
      </div>
    </li>
  );
}
