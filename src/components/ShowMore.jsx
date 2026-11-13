function ShowMore({ remaining, onClick }) {
  if (remaining <= 0) return null;

  return (
    <div className="show-more">
      <button type="button" className="row-button" onClick={onClick}>
        Show more ({remaining} left)
      </button>
    </div>
  );
}

export default ShowMore;
