eligible(U, S) :-
    user(U), station(S),
    #count { Sk : requires(S, Sk), not has_skill(U, Sk) } = 0.

eligible_day(U, S, D) :-
    eligible(U, S), day(D),
    not blocked_day(U, D).

 { assigned(U, S, D) : eligible_day(U, S, D) } Max :-
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


   % STAFFING QUALITY - derived facts for optimization

% Number of users assigned to a station on a given day.
staff_count(S, D, N) :-
    station(S), day(D),
    N = #count { U : assigned(U, S, D) }.

% A station is unstaffed if it has zero users on a given day.
unstaffed(S, D) :-
    station(S), day(D),
    not assigned(_, S, D).

shortfall(S, D, Gap) :-
    station(S), day(D),
    max_assignments(S, Max),
    staff_count(S, D, N),
    N > 0,
    Gap = Max - N,
    Gap > 0.


% OPTIMIZATION

% Priority @2: minimize unstaffed stations 
% Priority @1: minimize understaffed stations
% Weight 10 vs 1 ensures any unstaffed station is worse than all understaffing.
#minimize {
    10@2, S, D : unstaffed(S, D);
     2@1, S, D     : shortfall(S, D, 2);
     1@1, S, D     : shortfall(S, D, 1)
}.
