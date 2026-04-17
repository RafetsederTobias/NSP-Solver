% Each station must have exactly one user assigned per day
1 { assigned(U, S, D) : user(U, _) } 1 :- station(S, _), day(D).

% A user can only work one station per day
:- user(U, _), day(D), assigned(U, S1, D), assigned(U, S2, D), S1 != S2.