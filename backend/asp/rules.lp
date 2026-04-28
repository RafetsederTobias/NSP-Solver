
% A user is eligible for a station if they have all required skills
% reduces search space
eligible(U, S) :-
    user(U), station(S),
    #count { Sk : requires(S, Sk), not has_skill(U, Sk) } = 0.

eligible_day(U, S, D) :-
    eligible(U, S), day(D),
    not blocked_day(U, D).

% Assigning between 1 and Max eligible users to each station each day
% understaffing is handled via optimization below.
1 { assigned(U, S, D) : eligible_day(U, S, D) } Max :-
    station(S), day(D), max_assignments(S, Max).

% A user can only work one station per day
:- user(U), day(D),
   #count { S : assigned(U, S, D) } > 1.

% Fixed day constraint
:- user(U), fixed_day(U, D), day(D), not assigned(U, _, D).

% Max days per month 
:- user(U), max_days(U, Max),
   #count { D : assigned(U, _, D) } > Max.

% Min days per month
:- user(U), min_days(U, Min),
   #count { D : assigned(U, _, D) } < Min.

% Exact days per month 
:- user(U), exact_days(U, Exact),
   #count { D : assigned(U, _, D) } != Exact.

% Number of users assigned to a station on a given day.
staff_count(S, D, N) :-
    station(S), day(D),
    N = #count { U : assigned(U, S, D) }.

% understaffed = at least one user, but not value of maxAssignments users
understaffed(S, D) :-
    station(S), day(D),
    max_assignments(S, Max),
    staff_count(S, D, N),
    N > 0, N < Max.

% Priority @1: minimize understaffed stations
#minimize {
     1@1, S, D : understaffed(S, D)
}.

#heuristic assigned(U, S, D) : eligible_day(U, S, D). [1, true]
