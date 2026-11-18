export const groupThreads = (comments = []) => {
    const topLevel = [];
    const repliesByParent = {};

    comments.forEach((comment) => {
        if (!comment.parent) {
            topLevel.push(comment);
            return;
        }

        const key = String(comment.parent);
        if (!repliesByParent[key]) {
            repliesByParent[key] = [];
        }
        repliesByParent[key].push(comment);
    });

    return { topLevel, repliesByParent };
};
