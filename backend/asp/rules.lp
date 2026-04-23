% Each station must have exactly one user assigned per day
1 { assigned(U, S, D) : user(U) } 1 :- station(S), day(D).

% A user can only work one station per day
:- user(U), day(D), assigned(U, S1, D), assigned(U, S2, D), S1 != S2.

% A user can only be assigned if they have all required skills
:- assigned(U, S, D), requires(S, Sk), not has_skill(U, Sk).

% total days assigned per user
days_assigned(U, N) :- user(U), N = #count { D : assigned(U, _, D) }.

% max days constraint
:- max_days(U, Max), days_assigned(U, N), N > Max.

% min days constraint
:- min_days(U, Min), days_assigned(U, N), N < Min.

% exact days constraint
:- exact_days(U, Exact), days_assigned(U, N), N != Exact.