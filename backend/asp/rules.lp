eligible(U, S) :-
    user(U), station(S),
    #count { Sk : requires(S, Sk), not has_skill(U, Sk) } = 0.

eligible_day(U, S, D) :-
    eligible(U, S), day(D),
    not blocked_day(U, D).

1 { assigned(U, S, D) : eligible_day(U, S, D) } Max :-
    station(S), day(D), max_assignments(S, Max).

% user nicht bei 2 stationen an einem tag
:- user(U), day(D),
   #count { S : assigned(U, S, D) } > 1.

:- user(U), fixed_day(U, D), day(D), not assigned(U, _, D).

:- user(U), max_days(U, Max),
   #count { D : assigned(U, _, D) } > Max.

:- user(U), min_days(U, Min),
   #count { D : assigned(U, _, D) } < Min.

:- user(U), exact_days(U, Exact),
   #count { D : assigned(U, _, D) } != Exact.
